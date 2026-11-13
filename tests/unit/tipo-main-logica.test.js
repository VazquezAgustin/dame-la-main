import { describe, it, expect } from "vitest";
import { assignPalabras, buildTipoInitialState, pointsForPosition } from "../../js/games/tipo-main/logica.js";
import {
  PALABRAS_TIPO, PALABRAS_SUAVES, PALABRAS_PICANTES, poolForPack,
} from "../../js/games/tipo-main/palabras.js";

describe("¿Qué tipo soy? — banco de categorías", () => {
  it("tiene al menos 60 categorías y ninguna repetida", () => {
    expect(PALABRAS_TIPO.length).toBeGreaterThanOrEqual(60);
    expect(new Set(PALABRAS_TIPO).size).toBe(PALABRAS_TIPO.length);
  });

  it("no hay categorías vacías", () => {
    PALABRAS_TIPO.forEach(p => expect(p.trim().length).toBeGreaterThan(0));
  });

  it("incluye las categorías propuestas", () => {
    ["Falopero", "Gordo", "Infieles", "Aura", "Cornudos", "Alcohólicos"].forEach(p =>
      expect(PALABRAS_TIPO).toContain(p));
  });
});

describe("¿Qué tipo soy? — assignPalabras", () => {
  const ids = ["a", "b", "c", "d", "e"];

  it("asigna una categoría del pool a cada jugador", () => {
    const r = assignPalabras(ids);
    expect(Object.keys(r).sort()).toEqual(ids);
    Object.values(r).forEach(p => expect(PALABRAS_TIPO).toContain(p));
  });

  it("las categorías son distintas dentro de la ronda", () => {
    for (let k = 0; k < 50; k++) {
      const r = assignPalabras(ids);
      expect(new Set(Object.values(r)).size).toBe(ids.length);
    }
  });

  it("evita las categorías excluidas (ronda anterior)", () => {
    const pool = ["A", "B", "C", "D"];
    for (let k = 0; k < 30; k++) {
      const r = assignPalabras(["x", "y"], Math.random, pool, ["A", "B"]);
      expect(Object.values(r).sort()).toEqual(["C", "D"]);
    }
  });

  it("si el pool sin excluidas no alcanza, ignora la exclusión", () => {
    const pool = ["A", "B", "C"];
    const r = assignPalabras(["x", "y"], Math.random, pool, ["A", "B"]);
    expect(new Set(Object.values(r)).size).toBe(2);
  });

  it("con más jugadores que categorías repite sin romperse", () => {
    const r = assignPalabras(["x", "y", "z"], Math.random, ["A", "B"]);
    expect(Object.keys(r).length).toBe(3);
    Object.values(r).forEach(p => expect(["A", "B"]).toContain(p));
  });

  it("sin jugadores devuelve un objeto vacío", () => {
    expect(assignPalabras([])).toEqual({});
  });

  it("es determinista con un rng inyectado", () => {
    const rng = () => 0;
    expect(assignPalabras(["x", "y"], rng, ["A", "B", "C"])).toEqual({ x: "A", y: "B" });
  });
});

describe("¿Qué tipo soy? — estado inicial y puntos", () => {
  it("buildTipoInitialState", () => {
    expect(buildTipoInitialState()).toEqual({
      gameType: "tipo-main", tipoPack: "mixto", selectorIndex: 0, tipoRoundNumber: 0, tipoRound: null,
    });
  });

  it("puntos 300/200/100 por orden de acierto", () => {
    expect([1, 2, 3, 4].map(pointsForPosition)).toEqual([300, 200, 100, 100]);
  });
});

describe("¿Qué tipo soy? — packs de tono", () => {
  it("suaves y picantes no se pisan y juntos forman el banco completo", () => {
    const picantes = new Set(PALABRAS_PICANTES);
    PALABRAS_SUAVES.forEach(p => expect(picantes.has(p)).toBe(false));
    expect(PALABRAS_SUAVES.length + PALABRAS_PICANTES.length).toBe(PALABRAS_TIPO.length);
  });

  it("cada pack alcanza para una mesa grande", () => {
    expect(PALABRAS_SUAVES.length).toBeGreaterThanOrEqual(30);
    expect(PALABRAS_PICANTES.length).toBeGreaterThanOrEqual(30);
  });

  it("poolForPack devuelve el pool de cada tono; desconocido o ausente → mixto", () => {
    expect(poolForPack("suave")).toBe(PALABRAS_SUAVES);
    expect(poolForPack("picante")).toBe(PALABRAS_PICANTES);
    expect(poolForPack("mixto")).toBe(PALABRAS_TIPO);
    expect(poolForPack(undefined)).toBe(PALABRAS_TIPO);
  });

  it("el pack suave no reparte categorías picantes", () => {
    const picantes = new Set(PALABRAS_PICANTES);
    for (let k = 0; k < 30; k++) {
      const r = assignPalabras(["a", "b", "c", "d", "e", "f"], Math.random, poolForPack("suave"));
      Object.values(r).forEach(p => expect(picantes.has(p)).toBe(false));
    }
  });

  it("buildTipoInitialState guarda el pack y cae en mixto si es inválido", () => {
    expect(buildTipoInitialState("suave").tipoPack).toBe("suave");
    expect(buildTipoInitialState().tipoPack).toBe("mixto");
    expect(buildTipoInitialState("cualquiera").tipoPack).toBe("mixto");
  });
});
