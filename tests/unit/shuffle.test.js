import { describe, it, expect } from "vitest";
import { shuffle } from "../../js/shuffle.js";

describe("shuffle (Fisher-Yates)", () => {
  it("devuelve una permutación con los mismos elementos", () => {
    const arr = [1, 2, 3, 4, 5, 6, 7];
    expect(shuffle(arr).sort()).toEqual([...arr].sort());
  });

  it("no muta el array original", () => {
    const arr = ["a", "b", "c", "d"];
    shuffle(arr);
    expect(arr).toEqual(["a", "b", "c", "d"]);
  });

  it("es determinista con un rng inyectado", () => {
    const rng = () => 0; // siempre intercambia con la posición 0
    expect(shuffle([1, 2, 3, 4], rng)).toEqual([2, 3, 4, 1]);
  });

  it("maneja arrays vacíos y de un elemento", () => {
    expect(shuffle([])).toEqual([]);
    expect(shuffle(["x"])).toEqual(["x"]);
  });

  it("reparte parejo: cada elemento cae en cada posición con frecuencia similar", () => {
    const N = 6000;
    const counts = [0, 0, 0].map(() => [0, 0, 0]);
    for (let i = 0; i < N; i++) {
      shuffle([0, 1, 2]).forEach((el, pos) => counts[el][pos]++);
    }
    // Esperado: N/3 = 2000 por casillero; tolerancia amplia para no ser flaky
    counts.flat().forEach(c => {
      expect(c).toBeGreaterThan(1750);
      expect(c).toBeLessThan(2250);
    });
  });
});
