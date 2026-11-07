import { describe, it, expect } from "vitest";
import {
  NUMBER_MIN, NUMBER_MAX,
  assignNumbers, pointsForPosition, guessedCount, allGuessed, buildNumeroInitialState,
} from "../../js/games/numero-main/logica.js";

function seeded(seed) {
  let s = seed;
  return () => { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296; };
}

describe("assignNumbers", () => {
  it("asigna una clave por jugador", () => {
    const r = assignNumbers(["a", "b", "c"]);
    expect(Object.keys(r).sort()).toEqual(["a", "b", "c"]);
  });

  it("todos los números son enteros dentro de [1, 99]", () => {
    const r = assignNumbers(["a", "b", "c", "d", "e"]);
    Object.values(r).forEach(n => {
      expect(Number.isInteger(n)).toBe(true);
      expect(n).toBeGreaterThanOrEqual(NUMBER_MIN);
      expect(n).toBeLessThanOrEqual(NUMBER_MAX);
    });
  });

  it("no repite números (20 jugadores, varias semillas)", () => {
    const ids = Array.from({ length: 20 }, (_, i) => "p" + i);
    for (let seed = 1; seed <= 25; seed++) {
      const vals = Object.values(assignNumbers(ids, seeded(seed)));
      expect(new Set(vals).size).toBe(20);
    }
  });

  it("es determinista con un rng fijo", () => {
    const ids = ["a", "b", "c"];
    expect(assignNumbers(ids, seeded(7))).toEqual(assignNumbers(ids, seeded(7)));
  });

  it("devuelve {} sin jugadores", () => {
    expect(assignNumbers([])).toEqual({});
    expect(assignNumbers()).toEqual({});
  });

  it("no muta el array de entrada", () => {
    const ids = ["a", "b"];
    assignNumbers(ids);
    expect(ids).toEqual(["a", "b"]);
  });

  it("puede llegar a los extremos del rango", () => {
    expect(assignNumbers(["a"], () => 0).a).toBe(1);
    expect(assignNumbers(["a"], () => 0.999999).a).toBe(99);
  });

  it("con más jugadores que números, repite sin romperse", () => {
    const r = assignNumbers(["a", "b", "c"], seeded(3), 1, 2);
    expect(Object.keys(r)).toHaveLength(3);
    Object.values(r).forEach(n => expect([1, 2]).toContain(n));
  });
});

describe("pointsForPosition", () => {
  it("1 → 300, 2 → 200, 3 → 100", () => {
    expect(pointsForPosition(1)).toBe(300);
    expect(pointsForPosition(2)).toBe(200);
    expect(pointsForPosition(3)).toBe(100);
  });
  it("del 3.º en adelante sigue en 100", () => {
    expect(pointsForPosition(10)).toBe(100);
  });
  it("0 o inválido → 0", () => {
    expect(pointsForPosition(0)).toBe(0);
    expect(pointsForPosition(-1)).toBe(0);
    expect(pointsForPosition(undefined)).toBe(0);
  });
});

describe("guessedCount / allGuessed", () => {
  it("guessedCount maneja null, vacío y parcial", () => {
    expect(guessedCount(null)).toBe(0);
    expect(guessedCount({})).toBe(0);
    expect(guessedCount({ a: { position: 1, points: 300 } })).toBe(1);
  });

  it("allGuessed: null, vacío, parcial y completo", () => {
    const order = ["a", "b"];
    expect(allGuessed(order, null)).toBe(false);
    expect(allGuessed(order, {})).toBe(false);
    expect(allGuessed(order, { a: { position: 1, points: 300 } })).toBe(false);
    expect(allGuessed(order, {
      a: { position: 1, points: 300 }, b: { position: 2, points: 200 },
    })).toBe(true);
  });

  it("allGuessed con playerOrder vacío es false", () => {
    expect(allGuessed([], {})).toBe(false);
    expect(allGuessed(undefined, {})).toBe(false);
  });
});

describe("buildNumeroInitialState", () => {
  it("devuelve la forma esperada", () => {
    expect(buildNumeroInitialState()).toEqual({
      gameType: "numero-main",
      selectorIndex: 0,
      numeroRoundNumber: 0,
      numeroRound: null,
    });
  });
});
