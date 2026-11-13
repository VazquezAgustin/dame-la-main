import { describe, it, expect } from "vitest";
import {
  getRules, nextSelectorIndex, canAttempt, blockedFromQuestion, reboundCandidates,
  maxWager, clampWager, pickFinalQuestion, finalDeltas, computeAwards, nextBestStreak,
  FINAL_MIN_WAGER_CAP,
} from "../../js/logica.js";
import { acumularUsados } from "../../js/historial.js";
import { CATEGORY_POOL } from "../../js/preguntas.js";

const ORDER = ["a", "b", "c"];
const PLAYERS = {
  a: { name: "A", score: 0, connected: true },
  b: { name: "B", score: 0, connected: true },
  c: { name: "C", score: 0, connected: true },
};

describe("getRules", () => {
  it("salas viejas sin `rules` → todo apagado", () => {
    expect(getRules({})).toEqual({ rebote: false, ganadorElige: false, finalApuesta: false });
    expect(getRules(null)).toEqual({ rebote: false, ganadorElige: false, finalApuesta: false });
  });

  it("solo cuenta `true` explícito", () => {
    expect(getRules({ rules: { rebote: true, ganadorElige: "si", finalApuesta: false } }))
      .toEqual({ rebote: true, ganadorElige: false, finalApuesta: false });
  });
});

describe("nextSelectorIndex — elige el que acierta", () => {
  const base = { playerOrder: ORDER, selectorIndex: 0 };

  it("sin la regla, siempre rota", () => {
    expect(nextSelectorIndex({ ...base, questionResult: { responderId: "c", correct: true } })).toBe(1);
    expect(nextSelectorIndex({ ...base, selectorIndex: 2 })).toBe(0);
  });

  it("con la regla, elige el que acertó", () => {
    const s = { ...base, rules: { ganadorElige: true }, questionResult: { responderId: "c", correct: true } };
    expect(nextSelectorIndex(s)).toBe(2);
  });

  it("con la regla, si falló o nadie respondió sigue la rotación", () => {
    const rules = { ganadorElige: true };
    expect(nextSelectorIndex({ ...base, rules, questionResult: { responderId: "c", correct: false } })).toBe(1);
    expect(nextSelectorIndex({ ...base, rules, questionResult: null })).toBe(1);
  });

  it("si el que acertó ya no está en la sala, rota", () => {
    const s = { ...base, rules: { ganadorElige: true }, questionResult: { responderId: "zzz", correct: true } };
    expect(nextSelectorIndex(s)).toBe(1);
  });

  it("sin jugadores devuelve 0", () => {
    expect(nextSelectorIndex({ playerOrder: [] })).toBe(0);
  });
});

describe("Rebote — quién puede responder", () => {
  it("canAttempt: bloquea a los que fallaron y a los que vieron la respuesta", () => {
    const q = { failed: ["a"], sawAnswer: ["b"] };
    expect(canAttempt(q, "a")).toBe(false);
    expect(canAttempt(q, "b")).toBe(false);
    expect(canAttempt(q, "c")).toBe(true);
    expect(blockedFromQuestion(q).sort()).toEqual(["a", "b"]);
  });

  it("canAttempt: pregunta recién abierta → todos pueden", () => {
    expect(canAttempt({ category: "X", value: 200 }, "a")).toBe(true);
    expect(canAttempt(null, "a")).toBe(true);
  });

  it("reboundCandidates excluye al que falla, al host y a los ya bloqueados", () => {
    const s = { playerOrder: ORDER, players: PLAYERS, currentQuestion: {} };
    expect(reboundCandidates(s, "b", "a")).toEqual(["c"]);
  });

  it("con dos jugadores (host + 1) no hay rebote posible", () => {
    const s = { playerOrder: ["a", "b"], players: PLAYERS, currentQuestion: {} };
    expect(reboundCandidates(s, "b", "a")).toEqual([]);
  });

  it("no cuenta a los desconectados", () => {
    const players = { ...PLAYERS, c: { ...PLAYERS.c, connected: false } };
    const s = { playerOrder: ORDER, players, currentQuestion: {} };
    expect(reboundCandidates(s, "b", "a")).toEqual([]);
  });

  it("cuando falla el propio host, el resto puede rebotar", () => {
    const s = { playerOrder: ORDER, players: PLAYERS, currentQuestion: {} };
    expect(reboundCandidates(s, "a", "a")).toEqual(["b", "c"]);
  });

  it("segundo rebote: ya no quedan candidatos", () => {
    const s = { playerOrder: ORDER, players: PLAYERS, currentQuestion: { failed: ["b"], sawAnswer: ["a"] } };
    expect(reboundCandidates(s, "c", "a")).toEqual([]);
  });
});

describe("Ronda final — apuestas", () => {
  it("maxWager: el puntaje, con piso para los que van mal", () => {
    expect(maxWager(1800)).toBe(1800);
    expect(maxWager(200)).toBe(FINAL_MIN_WAGER_CAP);
    expect(maxWager(-600)).toBe(FINAL_MIN_WAGER_CAP);
    expect(maxWager(undefined)).toBe(FINAL_MIN_WAGER_CAP);
  });

  it("clampWager: acota entre 0 y el máximo, y descarta basura", () => {
    expect(clampWager("700", 1000)).toBe(700);
    expect(clampWager(5000, 1000)).toBe(1000);
    expect(clampWager(-50, 1000)).toBe(0);
    expect(clampWager("12.9", 1000)).toBe(12);
    expect(clampWager("abc", 1000)).toBe(0);
    expect(clampWager(400, -200)).toBe(400);
  });

  it("finalDeltas: +apuesta si acertó, −apuesta si no; sin apuesta no cambia", () => {
    const wagers   = { a: 500, b: 300, c: 0 };
    const verdicts = { a: true, b: false, c: true };
    expect(finalDeltas(ORDER, wagers, verdicts)).toEqual({ a: 500, b: -300 });
  });

  it("finalDeltas: apostó pero no fue corregido (o no respondió) → pierde", () => {
    expect(finalDeltas(["a", "b"], { a: 400 }, {})).toEqual({ a: -400 });
  });
});

describe("pickFinalQuestion", () => {
  const cats  = CATEGORY_POOL.slice(0, 2);
  const libre = { "200": false, "400": false, "600": false, "800": false, "1000": false };
  const llena = { "200": true, "400": true, "600": true, "800": true, "1000": true };

  it("elige la celda sin jugar de mayor valor del tablero", () => {
    const board = { [cats[0]]: { ...llena }, [cats[1]]: { ...llena, "800": false, "400": false } };
    expect(pickFinalQuestion(board, cats, CATEGORY_POOL)).toEqual({ category: cats[1], value: 800 });
  });

  it("con varias de 1000 libres elige una de ellas", () => {
    const board = { [cats[0]]: { ...libre }, [cats[1]]: { ...libre } };
    const q = pickFinalQuestion(board, cats, CATEGORY_POOL);
    expect(q.value).toBe(1000);
    expect(cats).toContain(q.category);
  });

  it("tablero completo → la de 1000 de una categoría fuera del tablero", () => {
    const board = { [cats[0]]: { ...llena }, [cats[1]]: { ...llena } };
    const q = pickFinalQuestion(board, cats, CATEGORY_POOL);
    expect(q.value).toBe(1000);
    expect(cats).not.toContain(q.category);
    expect(CATEGORY_POOL).toContain(q.category);
  });

  it("sin nada disponible devuelve null", () => {
    const board = { [cats[0]]: { ...llena } };
    expect(pickFinalQuestion(board, [cats[0]], [cats[0]])).toBeNull();
  });
});

describe("Premios del podio", () => {
  it("sin stats no hay premios", () => {
    expect(computeAwards(undefined, ORDER)).toEqual([]);
    expect(computeAwards({}, ORDER)).toEqual([]);
  });

  it("premia al máximo de cada categoría", () => {
    const stats = {
      a: { buzzes: 5, bestStreak: 3, steals: 0, lost: 200 },
      b: { buzzes: 2, bestStreak: 1, steals: 2, lost: 900 },
    };
    const premios = computeAwards(stats, ORDER);
    const por = Object.fromEntries(premios.map(p => [p.titulo, p]));
    expect(por["Dedo más rápido"].ganadores).toEqual(["a"]);
    expect(por["Mejor racha"].ganadores).toEqual(["a"]);
    expect(por["El ladrón"].ganadores).toEqual(["b"]);
    expect(por["El que más perdió"].ganadores).toEqual(["b"]);
    expect(por["El que más perdió"].detalle).toBe("−900 pts");
  });

  it("una racha de 1 no alcanza para el premio", () => {
    const premios = computeAwards({ a: { bestStreak: 1 } }, ORDER);
    expect(premios.find(p => p.titulo === "Mejor racha")).toBeUndefined();
  });

  it("en empate lista a todos, y ignora a los que ya no están en la sala", () => {
    const stats = { a: { buzzes: 3 }, c: { buzzes: 3 }, echado: { buzzes: 99 } };
    const premios = computeAwards(stats, ORDER);
    expect(premios[0].ganadores).toEqual(["a", "c"]);
  });

  it("nextBestStreak cuenta el acierto que se está por registrar", () => {
    expect(nextBestStreak({}, "a")).toBe(1);
    expect(nextBestStreak({ a: { streak: 2, bestStreak: 2 } }, "a")).toBe(3);
    expect(nextBestStreak({ a: { streak: 0, bestStreak: 4 } }, "a")).toBe(4);
  });
});

describe("Historial — acumularUsados", () => {
  it("acumula sin duplicar mientras quede otra tanda sin usar", () => {
    expect(acumularUsados(["a", "b"], ["b", "c"], 12, 3).sort()).toEqual(["a", "b", "c"]);
  });

  it("se reinicia con lo recién usado cuando ya no alcanza para otra tanda", () => {
    expect(acumularUsados(["a", "b", "c", "d"], ["e", "f"], 7, 2)).toEqual(["e", "f"]);
  });

  it("si queda exactamente una tanda, todavía no se reinicia", () => {
    expect(acumularUsados(["a", "b"], ["c", "d"], 6, 2).sort()).toEqual(["a", "b", "c", "d"]);
  });
});
