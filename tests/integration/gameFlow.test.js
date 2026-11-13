import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createInMemoryDao } from "../helpers/inMemoryDao.js";
import { isBoardComplete, countAnsweredCells } from "../../js/logica.js";
import { CATEGORY_POOL } from "../../js/preguntas.js";

const ROOM   = "FLOW01";
const HOST   = "p_host";
const P1     = "p_p1";
const P2     = "p_p2";
const CATS   = CATEGORY_POOL.slice(0, 2); // 2 categorías = 10 celdas totales

function makeInitialState(categories) {
  return {
    createdAt: Date.now(),
    hostId: HOST,
    status: "lobby",
    categories,
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

let dao;

function getState() {
  let last = null;
  dao.subscribe(ROOM, s => { last = s; });
  return last;
}

describe("Flujo completo de partida", () => {
  beforeEach(async () => {
    dao = createInMemoryDao();
    await dao.createRoom(ROOM, makeInitialState(CATS));
  });

  it("1. Sala creada en lobby con el host", () => {
    const s = getState();
    expect(s.status).toBe("lobby");
    expect(s.hostId).toBe(HOST);
    expect(s.playerOrder).toContain(HOST);
  });

  it("2. Dos jugadores se unen → playerOrder tiene 3 elementos", async () => {
    await dao.joinRoom(ROOM, P1, { name: "P1", score: 0, connected: true });
    await dao.joinRoom(ROOM, P2, { name: "P2", score: 0, connected: true });
    const s = getState();
    expect(s.playerOrder).toHaveLength(3);
    expect(s.players[P1]).toBeDefined();
    expect(s.players[P2]).toBeDefined();
  });

  it("3. Host arranca → status: playing", async () => {
    await dao.startGame(ROOM);
    expect(getState().status).toBe("playing");
  });

  it("4. Selector elige celda → currentQuestion poblado, fase waiting_buzz", async () => {
    await dao.startGame(ROOM);
    await dao.selectQuestion(ROOM, CATS[0], 200);
    const s = getState();
    expect(s.currentQuestion).not.toBeNull();
    expect(s.currentQuestion.category).toBe(CATS[0]);
    expect(s.currentQuestion.value).toBe(200);
    expect(s.questionPhase).toBe("waiting_buzz");
    expect(s.buzzer ?? null).toBeNull();
  });

  it("5. Jugador buzzea → buzzer registrado, fase waiting_answer", async () => {
    await dao.startGame(ROOM);
    await dao.selectQuestion(ROOM, CATS[0], 200);
    const won = await dao.pressBuzzer(ROOM, P1);
    const s = getState();
    expect(won).toBe(true);
    expect(s.buzzer.playerId).toBe(P1);
    expect(s.questionPhase).toBe("waiting_answer");
  });

  it("6. Revelar respuesta → fase answer_revealed", async () => {
    await dao.startGame(ROOM);
    await dao.joinRoom(ROOM, P1, { name: "P1", score: 0, connected: true });
    await dao.selectQuestion(ROOM, CATS[0], 200);
    await dao.pressBuzzer(ROOM, P1);
    await dao.revealAnswer(ROOM, P1);
    expect(getState().questionPhase).toBe("answer_revealed");
  });

  it("7. Host juzga correcto → score sube, celda marcada, fase judged", async () => {
    await dao.startGame(ROOM);
    await dao.joinRoom(ROOM, P1, { name: "P1", score: 0, connected: true });
    await dao.selectQuestion(ROOM, CATS[0], 400);
    await dao.pressBuzzer(ROOM, P1);
    await dao.revealAnswer(ROOM, P1);
    await dao.judgeAnswer(ROOM, P1, true, 400, CATS[0], 400);

    const s = getState();
    expect(s.players[P1].score).toBe(400);
    expect(s.board[CATS[0]]?.["400"]).toBe(true);
    expect(s.questionPhase).toBe("judged");
    expect(s.questionResult.correct).toBe(true);
  });

  it("8. Host juzga incorrecto → score baja (delta negativo)", async () => {
    await dao.startGame(ROOM);
    await dao.joinRoom(ROOM, P1, { name: "P1", score: 600, connected: true });
    await dao.selectQuestion(ROOM, CATS[0], 200);
    await dao.pressBuzzer(ROOM, P1);
    await dao.revealAnswer(ROOM, P1);
    await dao.judgeAnswer(ROOM, P1, false, -200, CATS[0], 200);

    const s = getState();
    expect(s.players[P1].score).toBe(400);
    expect(s.questionResult.correct).toBe(false);
  });

  it("9. nextTurn → selectorIndex avanza, estado de pregunta limpio", async () => {
    await dao.startGame(ROOM);
    await dao.joinRoom(ROOM, P1, { name: "P1", score: 0, connected: true });
    await dao.selectQuestion(ROOM, CATS[0], 200);
    await dao.pressBuzzer(ROOM, P1);
    await dao.revealAnswer(ROOM, P1);
    await dao.judgeAnswer(ROOM, P1, true, 200, CATS[0], 200);
    await dao.nextTurn(ROOM, 1, false);

    const s = getState();
    expect(s.selectorIndex).toBe(1);
    expect(s.currentQuestion).toBeUndefined();
    expect(s.buzzer).toBeUndefined();
    expect(s.questionPhase).toBeUndefined();
    expect(s.questionResult).toBeUndefined();
    expect(s.status).toBe("playing");
  });

  it("10. Al agotar todas las celdas, nextTurn con isGameOver=true → status: finished", async () => {
    await dao.startGame(ROOM);
    await dao.joinRoom(ROOM, P1, { name: "P1", score: 0, connected: true });

    const values = [200, 400, 600, 800, 1000];
    let selector = 0;
    for (const cat of CATS) {
      for (const val of values) {
        await dao.selectQuestion(ROOM, cat, val);
        await dao.pressBuzzer(ROOM, P1);
        await dao.revealAnswer(ROOM, P1);
        await dao.judgeAnswer(ROOM, P1, true, val, cat, val);
        const board = getState().board;
        const finished = isBoardComplete(board, CATS);
        selector = (selector + 1) % 2;
        await dao.nextTurn(ROOM, selector, finished);
      }
    }

    expect(getState().status).toBe("finished");
  });

  it("isBoardComplete refleja correctamente el progreso", async () => {
    await dao.startGame(ROOM);
    await dao.joinRoom(ROOM, P1, { name: "P1", score: 0, connected: true });

    expect(isBoardComplete(getState().board, CATS)).toBe(false);
    expect(countAnsweredCells(getState().board, CATS)).toBe(0);

    // Jugar las 5 celdas de la primera categoría
    for (const val of [200, 400, 600, 800, 1000]) {
      await dao.selectQuestion(ROOM, CATS[0], val);
      await dao.pressBuzzer(ROOM, P1);
      await dao.revealAnswer(ROOM, P1);
      await dao.judgeAnswer(ROOM, P1, true, val, CATS[0], val);
      await dao.nextTurn(ROOM, 0, false);
    }

    const s = getState();
    expect(countAnsweredCells(s.board, CATS)).toBe(5);
    expect(isBoardComplete(s.board, CATS)).toBe(false); // falta Cat B
  });

  describe("Robo de respuesta", () => {
    afterEach(() => vi.useRealTimers());

    it("12. Robo en cadena: penaliza al robado y el ladrón responde", async () => {
      vi.useFakeTimers();
      vi.setSystemTime(1_000_000);
      await dao.startGame(ROOM);
      await dao.joinRoom(ROOM, P1, { name: "P1", score: 1000, connected: true });
      await dao.joinRoom(ROOM, P2, { name: "P2", score: 0, connected: true });
      await dao.selectQuestion(ROOM, CATS[0], 400);
      await dao.pressBuzzer(ROOM, P1);

      // Antes de 10s no se puede robar
      expect(await dao.stealBuzzer(ROOM, P2, P1, 200)).toBe(false);

      vi.setSystemTime(1_011_000);
      expect(await dao.stealBuzzer(ROOM, P2, P1, 200)).toBe(true);
      let s = getState();
      expect(s.buzzer.playerId).toBe(P2);
      expect(s.buzzer.stolenFrom).toContain(P1);
      expect(s.players[P1].score).toBe(800);

      // P1 ya perdió el turno: no puede robar de vuelta
      vi.setSystemTime(1_022_000);
      expect(await dao.stealBuzzer(ROOM, P1, P2, 200)).toBe(false);

      // Tras 10s, el host (tercer jugador) le roba a P2
      expect(await dao.stealBuzzer(ROOM, HOST, P2, 200)).toBe(true);
      s = getState();
      expect(s.buzzer.playerId).toBe(HOST);
      expect(s.buzzer.stolenFrom).toEqual([P1, P2]);

      await dao.revealAnswer(ROOM, HOST);
      await dao.judgeAnswer(ROOM, HOST, true, 400, CATS[0], 400);
      expect(getState().players[HOST].score).toBe(400);
    });

    it("13. Tras revelar la respuesta ya no se puede robar", async () => {
      vi.useFakeTimers();
      vi.setSystemTime(1_000_000);
      await dao.startGame(ROOM);
      await dao.joinRoom(ROOM, P1, { name: "P1", score: 0, connected: true });
      await dao.joinRoom(ROOM, P2, { name: "P2", score: 0, connected: true });
      await dao.selectQuestion(ROOM, CATS[0], 200);
      await dao.pressBuzzer(ROOM, P1);
      expect(await dao.revealAnswer(ROOM, P1)).toBe(true);
      vi.setSystemTime(1_020_000);
      expect(await dao.stealBuzzer(ROOM, P2, P1, 100)).toBe(false);
      expect(getState().players[P1].score).toBe(0);
    });

    it("14. revealAnswer solo lo puede hacer quien tiene el turno", async () => {
      await dao.startGame(ROOM);
      await dao.joinRoom(ROOM, P1, { name: "P1", score: 0, connected: true });
      await dao.joinRoom(ROOM, P2, { name: "P2", score: 0, connected: true });
      await dao.selectQuestion(ROOM, CATS[0], 200);
      await dao.pressBuzzer(ROOM, P1);
      expect(await dao.revealAnswer(ROOM, P2)).toBe(false);
      expect(getState().questionPhase).toBe("waiting_answer");
    });
  });

  it("11. skipQuestion marca celda sin modificar scores", async () => {
    await dao.startGame(ROOM);
    await dao.joinRoom(ROOM, P1, { name: "P1", score: 0, connected: true });
    await dao.selectQuestion(ROOM, CATS[0], 600);
    await dao.skipQuestion(ROOM, 1);

    const s = getState();
    expect(s.board[CATS[0]]?.["600"]).toBe(true);
    expect(s.players[HOST].score).toBe(0);
    expect(s.players[P1].score).toBe(0);
    expect(s.currentQuestion).toBeUndefined();
    expect(s.selectorIndex).toBe(1);
  });
});
