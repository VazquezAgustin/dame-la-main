import { describe, it, expect, beforeEach } from "vitest";
import { createInMemoryDao } from "../helpers/inMemoryDao.js";

const ROOM = "TEST01";
const HOST = "p_host";
const P1   = "p_player1";

function makeInitialState() {
  return {
    createdAt: Date.now(),
    hostId: HOST,
    status: "lobby",
    categories: ["Cat A", "Cat B"],
    players: {
      [HOST]: { name: "Host", score: 0, connected: true },
    },
    playerOrder: [HOST],
    selectorIndex: 0,
    board: {},
    currentQuestion: null,
    buzzer: null,
    questionPhase: null,
    questionResult: null,
  };
}

describe("InMemoryDao — contrato básico", () => {
  let dao;

  beforeEach(() => {
    dao = createInMemoryDao();
  });

  it("createRoom / roomExists", async () => {
    await dao.createRoom(ROOM, makeInitialState());
    expect(await dao.roomExists(ROOM)).toBe(true);
  });

  it("roomExists returns false for non-existent room", async () => {
    expect(await dao.roomExists("NOPE00")).toBe(false);
  });

  it("roomExists returns false for a room that is already playing", async () => {
    await dao.createRoom(ROOM, makeInitialState());
    await dao.startGame(ROOM);
    expect(await dao.roomExists(ROOM)).toBe(false); // status !== "lobby"
  });

  it("joinRoom adds player and extends playerOrder", async () => {
    await dao.createRoom(ROOM, makeInitialState());
    await dao.joinRoom(ROOM, P1, { name: "Player1", score: 0, connected: true });

    const states = [];
    dao.subscribe(ROOM, s => states.push(s));
    const last = states[states.length - 1];

    expect(last.players[P1]).toBeDefined();
    expect(last.playerOrder).toContain(P1);
  });

  it("joinRoom is idempotent — joining twice does not duplicate playerOrder", async () => {
    await dao.createRoom(ROOM, makeInitialState());
    await dao.joinRoom(ROOM, P1, { name: "Player1", score: 0, connected: true });
    await dao.joinRoom(ROOM, P1, { name: "Player1", score: 0, connected: true });

    const states = [];
    dao.subscribe(ROOM, s => states.push(s));
    const last = states[states.length - 1];
    expect(last.playerOrder.filter(id => id === P1)).toHaveLength(1);
  });

  it("startGame changes status to playing", async () => {
    await dao.createRoom(ROOM, makeInitialState());
    await dao.startGame(ROOM);

    const states = [];
    dao.subscribe(ROOM, s => states.push(s));
    expect(states[0].status).toBe("playing");
  });

  it("subscribe receives current state immediately on subscribe", async () => {
    await dao.createRoom(ROOM, makeInitialState());
    const received = [];
    dao.subscribe(ROOM, s => received.push(s));
    expect(received).toHaveLength(1);
    expect(received[0].status).toBe("lobby");
  });

  it("subscribe is called after each mutation", async () => {
    await dao.createRoom(ROOM, makeInitialState());
    const received = [];
    dao.subscribe(ROOM, s => received.push(s));
    await dao.startGame(ROOM);
    expect(received).toHaveLength(2);
    expect(received[1].status).toBe("playing");
  });

  it("unsubscribe stops future notifications", async () => {
    await dao.createRoom(ROOM, makeInitialState());
    const received = [];
    const unsub = dao.subscribe(ROOM, s => received.push(s));
    unsub();
    await dao.startGame(ROOM);
    expect(received).toHaveLength(1); // solo el inicial, sin el startGame
  });
});

// ── pressBuzzer race condition ────────────────────────────────
describe("InMemoryDao — pressBuzzer", () => {
  let dao;

  beforeEach(async () => {
    dao = createInMemoryDao();
    await dao.createRoom(ROOM, makeInitialState());
    await dao.startGame(ROOM);
    await dao.selectQuestion(ROOM, "Cat A", 200);
  });

  it("first caller wins the buzzer", async () => {
    const won = await dao.pressBuzzer(ROOM, HOST);
    expect(won).toBe(true);
  });

  it("second caller loses the buzzer", async () => {
    await dao.pressBuzzer(ROOM, HOST);
    const won2 = await dao.pressBuzzer(ROOM, P1);
    expect(won2).toBe(false);
  });

  it("only the winner is recorded in buzzer.playerId", async () => {
    await dao.pressBuzzer(ROOM, HOST);
    await dao.pressBuzzer(ROOM, P1);

    const states = [];
    dao.subscribe(ROOM, s => states.push(s));
    expect(states[0].buzzer.playerId).toBe(HOST);
  });

  it("winner sets questionPhase to waiting_answer", async () => {
    await dao.pressBuzzer(ROOM, HOST);
    const states = [];
    dao.subscribe(ROOM, s => states.push(s));
    expect(states[0].questionPhase).toBe("waiting_answer");
  });
});

// ── migrateHost guard ─────────────────────────────────────────
describe("InMemoryDao — migrateHost", () => {
  let dao;

  beforeEach(async () => {
    dao = createInMemoryDao();
    await dao.createRoom(ROOM, makeInitialState());
  });

  it("migrates host when currentHostId matches", async () => {
    await dao.migrateHost(ROOM, HOST, P1);
    const states = [];
    dao.subscribe(ROOM, s => states.push(s));
    expect(states[0].hostId).toBe(P1);
  });

  it("does NOT migrate when currentHostId does not match", async () => {
    await dao.migrateHost(ROOM, "wrong_id", P1);
    const states = [];
    dao.subscribe(ROOM, s => states.push(s));
    expect(states[0].hostId).toBe(HOST);
  });

  it("double migration: second call is a no-op after first succeeds", async () => {
    await dao.migrateHost(ROOM, HOST, P1);
    await dao.migrateHost(ROOM, HOST, "p_other"); // should not take effect
    const states = [];
    dao.subscribe(ROOM, s => states.push(s));
    expect(states[0].hostId).toBe(P1);
  });
});

// ── setupPresence ─────────────────────────────────────────────
describe("InMemoryDao — setupPresence", () => {
  it("marks player as connected: true", async () => {
    const dao = createInMemoryDao();
    const initial = makeInitialState();
    initial.players[HOST].connected = false;
    await dao.createRoom(ROOM, initial);
    await dao.setupPresence(ROOM, HOST);

    const states = [];
    dao.subscribe(ROOM, s => states.push(s));
    expect(states[0].players[HOST].connected).toBe(true);
  });
});
