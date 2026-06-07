import { describe, it, expect } from "vitest";
import {
  PALABRAS_SIMPLES,
  PELICULAS_Y_SERIES,
  pickPalabras,
  palabraCategoria,
  palabraCategoriaLabel,
} from "../../js/games/pictionary/palabras.js";

const POOLS = { PALABRAS_SIMPLES, PELICULAS_Y_SERIES };

describe("pools de palabras", () => {
  it("PALABRAS_SIMPLES tiene al menos 80 entradas", () => {
    expect(PALABRAS_SIMPLES.length).toBeGreaterThanOrEqual(80);
  });

  it("PELICULAS_Y_SERIES tiene al menos 60 entradas", () => {
    expect(PELICULAS_Y_SERIES.length).toBeGreaterThanOrEqual(60);
  });

  for (const [name, pool] of Object.entries(POOLS)) {
    it(`${name} no tiene duplicados`, () => {
      expect(new Set(pool).size).toBe(pool.length);
    });

    it(`${name} contiene solo strings no vacíos`, () => {
      for (const p of pool) {
        expect(typeof p).toBe("string");
        expect(p.trim().length).toBeGreaterThan(0);
      }
    });
  }
});

describe("pickPalabras", () => {
  it("devuelve 1 palabra por defecto", () => {
    expect(pickPalabras()).toHaveLength(1);
  });

  it("devuelve exactamente count cuando count < pool", () => {
    expect(pickPalabras(3)).toHaveLength(3);
  });

  it("limita al tamaño del pool cuando count lo excede", () => {
    const all = PALABRAS_SIMPLES.length + PELICULAS_Y_SERIES.length;
    expect(pickPalabras(99999, "mixto")).toHaveLength(all);
  });

  it("no devuelve duplicados", () => {
    const r = pickPalabras(20);
    expect(new Set(r).size).toBe(r.length);
  });

  it("no muta los pools", () => {
    const beforeS = [...PALABRAS_SIMPLES];
    const beforeP = [...PELICULAS_Y_SERIES];
    pickPalabras(10, "mixto");
    expect(PALABRAS_SIMPLES).toEqual(beforeS);
    expect(PELICULAS_Y_SERIES).toEqual(beforeP);
  });

  it("respeta la categoría 'simples'", () => {
    const set = new Set(PALABRAS_SIMPLES);
    for (const p of pickPalabras(15, "simples")) expect(set.has(p)).toBe(true);
  });

  it("respeta la categoría 'pelis'", () => {
    const set = new Set(PELICULAS_Y_SERIES);
    for (const p of pickPalabras(15, "pelis")) expect(set.has(p)).toBe(true);
  });
});

describe("palabraCategoria", () => {
  it("clasifica una película/serie como 'pelis'", () => {
    expect(palabraCategoria(PELICULAS_Y_SERIES[0])).toBe("pelis");
    expect(palabraCategoria("Frozen")).toBe("pelis");
  });

  it("clasifica una palabra simple como 'simples'", () => {
    expect(palabraCategoria(PALABRAS_SIMPLES[0])).toBe("simples");
    expect(palabraCategoria("perro")).toBe("simples");
  });

  it("trata una palabra desconocida o vacía como 'simples'", () => {
    expect(palabraCategoria("xyz123")).toBe("simples");
    expect(palabraCategoria("")).toBe("simples");
    expect(palabraCategoria()).toBe("simples");
  });
});

describe("palabraCategoriaLabel", () => {
  it("devuelve la etiqueta legible de una película/serie", () => {
    expect(palabraCategoriaLabel("Frozen")).toBe("Película o serie");
  });

  it("devuelve la etiqueta legible de una palabra simple", () => {
    expect(palabraCategoriaLabel("perro")).toBe("Palabra simple");
  });
});
