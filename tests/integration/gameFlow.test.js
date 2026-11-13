import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createInMemoryDao } from "../helpers/inMemoryDao.js";
import {
  isBoardComplete, countAnsweredCells, canAttempt, reboundCandidates, nextBestStreak,
  computeAwards, pickFinalQuestion, finalDeltas,
} from "../../js/logica.js";
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

  describe("Rebote", () => {
    it("15. Si alguien falla, la pregunta se reabre y otro puede responder", async () => {
      await dao.joinRoom(ROOM, P1, { name: "P1", score: 0, connected: true });
      await dao.joinRoom(ROOM, P2, { name: "P2", score: 0, connected: true });
      await dao.startGame(ROOM);
      await dao.selectQuestion(ROOM, CATS[0], 400);

      // P1 pulsa y falla → rebote
      await dao.pressBuzzer(ROOM, P1);
      await dao.revealAnswer(ROOM, P1);
      let s = getState();
      expect(reboundCandidates(s, P1, HOST)).toEqual([P2]);
      await dao.reboundQuestion(ROOM, P1, -400, [P1], [HOST]);

      s = getState();
      expect(s.questionPhase).toBe("waiting_buzz");
      expect(s.buzzer).toBeUndefined();
      expect(s.players[P1].score).toBe(-400);
      expect(s.board[CATS[0]]?.["400"]).not.toBe(true); // la celda sigue abierta
      expect(canAttempt(s.currentQuestion, P1)).toBe(false);   // ya falló
      expect(canAttempt(s.currentQuestion, HOST)).toBe(false); // vio la respuesta
      expect(canAttempt(s.currentQuestion, P2)).toBe(true);

      // P2 toma el rebote y acierta
      expect(await dao.pressBuzzer(ROOM, P2)).toBe(true);
      await dao.revealAnswer(ROOM, P2);
      await dao.judgeAnswer(ROOM, P2, true, 400, CATS[0], 400, 1);
      s = getState();
      expect(s.questionPhase).toBe("judged");
      expect(s.players[P2].score).toBe(400);
      expect(s.board[CATS[0]]["400"]).toBe(true);
      // Sin más candidatos, un segundo fallo ya no rebotaría
      expect(reboundCandidates(s, P2, HOST)).toEqual([]);
    });
  });

  describe("Stats para los premios del podio", () => {
    it("16. Pulsadas, rachas, robos y puntos perdidos quedan registrados", async () => {
      await dao.joinRoom(ROOM, P1, { name: "P1", score: 0, connected: true });
      await dao.startGame(ROOM);

      // P1 acierta dos seguidas
      for (const value of [200, 400]) {
        await dao.selectQuestion(ROOM, CATS[0], value);
        await dao.pressBuzzer(ROOM, P1);
        await dao.revealAnswer(ROOM, P1);
        await dao.judgeAnswer(ROOM, P1, true, value, CATS[0], value, nextBestStreak(getState().stats, P1));
        await dao.nextTurn(ROOM, 0, false);
      }
      // Después falla una: corta la racha pero conserva la mejor
      await dao.selectQuestion(ROOM, CATS[0], 600);
      await dao.pressBuzzer(ROOM, P1);
      await dao.revealAnswer(ROOM, P1);
      await dao.judgeAnswer(ROOM, P1, false, -600, CATS[0], 600);

      const s = getState();
      expect(s.stats[P1]).toMatchObject({ buzzes: 3, correct: 2, wrong: 1, streak: 0, bestStreak: 2, lost: 600 });
      const titulos = computeAwards(s.stats, s.playerOrder).map(a => a.titulo);
      expect(titulos).toEqual(["Dedo más rápido", "Mejor racha", "El que más perdió"]);
    });
  });

  describe("Ronda final con apuesta", () => {
    it("17. Apuestas, respuestas, corrección y cierre de la partida", async () => {
      await dao.joinRoom(ROOM, P1, { name: "P1", score: 0, connected: true });
      await dao.joinRoom(ROOM, P2, { name: "P2", score: 0, connected: true });
      await dao.startGame(ROOM);

      const q = pickFinalQuestion({}, CATS, CATEGORY_POOL);
      await dao.startFinalRound(ROOM, { active: true, phase: "announcing", category: q.category, value: q.value, openedAt: null });
      expect(getState().status).toBe("playing");
      expect(getState().finalRound.phase).toBe("announcing");

      await dao.setFinalPhase(ROOM, "betting");
      await dao.submitFinalWager(ROOM, HOST, 500);
      await dao.submitFinalWager(ROOM, P1, 300);
      // P2 no apuesta → juega con 0

      await dao.setFinalPhase(ROOM, "answering");
      await dao.submitFinalAnswer(ROOM, HOST, "respuesta del host");
      await dao.submitFinalAnswer(ROOM, P1, "respuesta de p1");

      await dao.setFinalPhase(ROOM, "judging");
      await dao.setFinalVerdict(ROOM, HOST, true);
      await dao.setFinalVerdict(ROOM, P1, false);

      let s = getState();
      const deltas = finalDeltas(s.playerOrder, s.finalRound.wagers, s.finalRound.verdicts);
      expect(deltas).toEqual({ [HOST]: 500, [P1]: -300 });
      await dao.applyFinalResults(ROOM, deltas);

      s = getState();
      expect(s.finalRound.phase).toBe("results");
      expect(s.players[HOST].score).toBe(500);
      expect(s.players[P1].score).toBe(-300);
      expect(s.players[P2].score).toBe(0);
      expect(s.stats[P1].lost).toBe(300); // la apuesta perdida cuenta para el podio

      await dao.endFinalRound(ROOM);
      s = getState();
      expect(s.status).toBe("finished");
      expect(s.finalRound.active).toBe(false);
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
