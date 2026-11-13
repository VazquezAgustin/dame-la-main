import { describe, it, expect } from "vitest";
import { FAMOSOS, pickFamosos } from "../../js/games/quien-es-main/famosos.js";

describe("FAMOSOS pool", () => {
  it("has at least 50 entries", () => {
    expect(FAMOSOS.length).toBeGreaterThanOrEqual(50);
  });

  it("has no duplicates", () => {
    const unique = new Set(FAMOSOS);
    expect(unique.size).toBe(FAMOSOS.length);
  });

  it("contains only non-empty strings", () => {
    for (const f of FAMOSOS) {
      expect(typeof f).toBe("string");
      expect(f.trim().length).toBeGreaterThan(0);
    }
  });
});

describe("pickFamosos", () => {
  it("returns 10 items by default", () => {
    expect(pickFamosos()).toHaveLength(10);
  });

  it("returns exactly count items when count < pool size", () => {
    expect(pickFamosos(5)).toHaveLength(5);
    expect(pickFamosos(20)).toHaveLength(20);
  });

  it("caps at pool size when count exceeds it", () => {
    const result = pickFamosos(9999);
    expect(result).toHaveLength(FAMOSOS.length);
  });

  it("returns no duplicates", () => {
    const result = pickFamosos(30);
    const unique = new Set(result);
    expect(unique.size).toBe(result.length);
  });

  it("does not mutate FAMOSOS", () => {
    const before = [...FAMOSOS];
    pickFamosos(10);
    expect(FAMOSOS).toEqual(before);
  });

  it("all returned items belong to FAMOSOS", () => {
    const poolSet = new Set(FAMOSOS);
    for (const f of pickFamosos(15)) {
      expect(poolSet.has(f)).toBe(true);
    }
  });
});

describe("pickFamosos con exclude", () => {
  it("no devuelve excluidos si hay suficientes disponibles", () => {
    const exclude = FAMOSOS.slice(0, 30);
    const r = pickFamosos(10, exclude);
    expect(r).toHaveLength(10);
    r.forEach(f => expect(exclude).not.toContain(f));
  });

  it("si no alcanzan, incluye los no excluidos y completa sin duplicados", () => {
    const libres = FAMOSOS.slice(0, 3);
    const exclude = FAMOSOS.slice(3);
    const r = pickFamosos(8, exclude);
    expect(r).toHaveLength(8);
    expect(new Set(r).size).toBe(8);
    libres.forEach(f => expect(r).toContain(f));
  });

  it("exclude vacío u omitido mantiene el comportamiento", () => {
    expect(pickFamosos(5)).toHaveLength(5);
    expect(pickFamosos(5, [])).toHaveLength(5);
    expect(new Set(pickFamosos(5, [])).size).toBe(5);
  });
});
