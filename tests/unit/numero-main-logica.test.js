import { describe, it, expect } from "vitest";
import {
  NUMBER_MIN, NUMBER_MAX,
  assignNumbers, pointsForPosition, guessedCount, allGuessed, buildNumeroInitialState,
  NUMBER_RANGES, normalizeRange, randomBigNumber, assignBigNumbers, assignNumbersByRange, formatNumero,
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
      numeroRange: "chico",
      selectorIndex: 0,
      numeroRoundNumber: 0,
      numeroRound: null,
    });
  });
});

describe("buildNumeroInitialState — rango", () => {
  it("guarda el rango pedido", () => {
    expect(buildNumeroInitialState({ numeroRange: "grande" }).numeroRange).toBe("grande");
  });
  it("un rango inválido cae a 'chico'", () => {
    expect(buildNumeroInitialState({ numeroRange: "enorme" }).numeroRange).toBe("chico");
  });
});

describe("normalizeRange", () => {
  it("acepta chico y grande", () => {
    expect(normalizeRange("chico")).toBe("chico");
    expect(normalizeRange("grande")).toBe("grande");
  });
  it("todo lo demás es chico (salas viejas sin campo)", () => {
    [undefined, null, "", "x", 5, "toString"].forEach(v => expect(normalizeRange(v)).toBe("chico"));
  });
});

describe("randomBigNumber", () => {
  const { min, max } = NUMBER_RANGES.grande;

  it("siempre entero dentro de [100, 100.000.000]", () => {
    const rng = seeded(11);
    for (let i = 0; i < 2000; i++) {
      const n = randomBigNumber(rng);
      expect(Number.isInteger(n)).toBe(true);
      expect(n).toBeGreaterThanOrEqual(min);
      expect(n).toBeLessThanOrEqual(max);
    }
  });

  it("es una cifra redonda: a lo sumo 2 cifras significativas", () => {
    const rng = seeded(5);
    for (let i = 0; i < 2000; i++) {
      const n = randomBigNumber(rng);
      expect(String(n).replace(/0+$/, "").length).toBeLessThanOrEqual(2);
    }
  });

  it("extremos del rng: 0 → 100, ~1 → 100.000.000", () => {
    expect(randomBigNumber(() => 0)).toBe(100);
    expect(randomBigNumber(() => 0.9999999)).toBe(100_000_000);
  });

  it("log-uniforme: salen cifras de todos los órdenes de magnitud", () => {
    const rng = seeded(21);
    const digits = new Set();
    for (let i = 0; i < 500; i++) digits.add(String(randomBigNumber(rng)).length);
    // de 3 a 9 dígitos
    for (let d = 3; d <= 8; d++) expect(digits.has(d)).toBe(true);
  });
});

describe("assignBigNumbers / assignNumbersByRange", () => {
  it("números distintos para 30 jugadores, varias semillas", () => {
    const ids = Array.from({ length: 30 }, (_, i) => "p" + i);
    for (let seed = 1; seed <= 20; seed++) {
      const vals = Object.values(assignBigNumbers(ids, seeded(seed)));
      expect(new Set(vals).size).toBe(30);
    }
  });

  it("es rápido (no arma un pool de 100 millones)", () => {
    const ids = Array.from({ length: 50 }, (_, i) => "p" + i);
    const t = performance.now();
    assignBigNumbers(ids);
    expect(performance.now() - t).toBeLessThan(50);
  });

  it("con rng constante no se cuelga y repite como último recurso", () => {
    const r = assignBigNumbers(["a", "b", "c"], () => 0.5);
    expect(Object.keys(r)).toHaveLength(3);
  });

  it("assignNumbersByRange despacha según el rango", () => {
    const chico  = assignNumbersByRange(["a", "b"], "chico", seeded(1));
    const grande = assignNumbersByRange(["a", "b"], "grande", seeded(1));
    Object.values(chico).forEach(n => expect(n).toBeLessThanOrEqual(99));
    Object.values(grande).forEach(n => expect(n).toBeGreaterThanOrEqual(100));
  });

  it("rango desconocido se reparte como chico", () => {
    Object.values(assignNumbersByRange(["a", "b"], undefined)).forEach(n => expect(n).toBeLessThanOrEqual(99));
  });
});

describe("formatNumero", () => {
  it("grande: separador de miles con punto", () => {
    expect(formatNumero(100, "grande")).toBe("100");
    expect(formatNumero(20000, "grande")).toBe("20.000");
    expect(formatNumero(4500000, "grande")).toBe("4.500.000");
    expect(formatNumero(100000000, "grande")).toBe("100.000.000");
  });
  it("chico: el número tal cual", () => {
    expect(formatNumero(73, "chico")).toBe("73");
    expect(formatNumero(73)).toBe("73");
  });
  it("sin número devuelve ''", () => {
    expect(formatNumero(undefined, "grande")).toBe("");
    expect(formatNumero(null, "chico")).toBe("");
  });
});
