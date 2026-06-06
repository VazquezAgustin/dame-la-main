import { describe, it, expect } from "vitest";
import {
  POINTS_FIRST_GUESS,
  POINTS_LATER_GUESS,
  POINTS_DRAWER_PER_HIT,
  normalize,
  isCorrectGuess,
  calcGuesserScore,
  calcDrawerScore,
  isRoundOver,
  isGameOver,
  nextSelectorIndex,
  classifyChatEntry,
  maskWord,
  buildPictionaryInitialState,
} from "../../js/games/pictionary/logica.js";

describe("normalize", () => {
  it("lowercases", () => {
    expect(normalize("JIRAFA")).toBe("jirafa");
  });

  it("strips accents/diacritics but keeps ñ", () => {
    expect(normalize("Jiráfa")).toBe("jirafa");
    expect(normalize("pingüino")).toBe("pinguino");
    expect(normalize("años")).toBe("años");
    expect(normalize("ÑOÑO")).toBe("ñoño");
  });

  it("removes punctuation and collapses spaces", () => {
    expect(normalize("Spider-Man!")).toBe("spider man");
    expect(normalize("  el   padrino  ")).toBe("el padrino");
    expect(normalize("¿Qué?")).toBe("que");
  });

  it("handles empty / non-string input", () => {
    expect(normalize("")).toBe("");
    expect(normalize()).toBe("");
    expect(normalize(123)).toBe("123");
  });
});

describe("isCorrectGuess", () => {
  it("matches ignoring case, accents and punctuation", () => {
    expect(isCorrectGuess("Jirafa", "jiráfa")).toBe(true);
    expect(isCorrectGuess("el padrino", "El Padrino")).toBe(true);
    expect(isCorrectGuess("spiderman", "spider-man")).toBe(false); // sin espacio NO matchea
    expect(isCorrectGuess("spider man", "Spider-Man")).toBe(true);
  });

  it("returns false for wrong guess", () => {
    expect(isCorrectGuess("perro", "gato")).toBe(false);
  });

  it("returns false when secret is empty", () => {
    expect(isCorrectGuess("algo", "")).toBe(false);
    expect(isCorrectGuess("", "")).toBe(false);
  });
});

describe("calcGuesserScore", () => {
  it("first guess scores more than later guesses (same time)", () => {
    expect(calcGuesserScore(0, 0)).toBe(POINTS_FIRST_GUESS);
    expect(calcGuesserScore(1, 0)).toBe(POINTS_LATER_GUESS);
    expect(calcGuesserScore(0, 0)).toBeGreaterThan(calcGuesserScore(1, 0));
  });

  it("adds a time bonus proportional to remaining fraction", () => {
    expect(calcGuesserScore(0, 1)).toBe(POINTS_FIRST_GUESS + Math.round(POINTS_FIRST_GUESS * 0.5));
    expect(calcGuesserScore(0, 0.5)).toBe(POINTS_FIRST_GUESS + Math.round(POINTS_FIRST_GUESS * 0.25));
  });

  it("clamps remaining fraction to [0,1]", () => {
    expect(calcGuesserScore(0, 5)).toBe(calcGuesserScore(0, 1));
    expect(calcGuesserScore(0, -3)).toBe(calcGuesserScore(0, 0));
  });
});

describe("calcDrawerScore", () => {
  it("rewards per correct guesser", () => {
    expect(calcDrawerScore(0)).toBe(0);
    expect(calcDrawerScore(3)).toBe(3 * POINTS_DRAWER_PER_HIT);
  });

  it("never negative", () => {
    expect(calcDrawerScore(-2)).toBe(0);
  });
});

describe("isRoundOver", () => {
  const order = ["p_draw", "p_a", "p_b"];

  it("is false until all non-drawers guessed", () => {
    expect(isRoundOver({}, order, "p_draw")).toBe(false);
    expect(isRoundOver({ p_a: { order: 0 } }, order, "p_draw")).toBe(false);
  });

  it("is true when all non-drawers guessed", () => {
    expect(isRoundOver({ p_a: {}, p_b: {} }, order, "p_draw")).toBe(true);
  });

  it("ignores the drawer (drawer never needs to guess)", () => {
    expect(isRoundOver({ p_a: {}, p_b: {} }, order, "p_draw")).toBe(true);
  });

  it("is true when there are no guessers", () => {
    expect(isRoundOver({}, ["p_draw"], "p_draw")).toBe(true);
  });
});

describe("isGameOver", () => {
  it("returns false when rounds remaining", () => {
    expect(isGameOver(1, 2, 3)).toBe(false);
  });
  it("returns true at or beyond total", () => {
    expect(isGameOver(6, 2, 3)).toBe(true);
    expect(isGameOver(7, 2, 3)).toBe(true);
  });
});

describe("nextSelectorIndex", () => {
  it("increments and wraps", () => {
    expect(nextSelectorIndex(0, 3)).toBe(1);
    expect(nextSelectorIndex(2, 3)).toBe(0);
  });
  it("returns 0 for zero playerCount", () => {
    expect(nextSelectorIndex(0, 0)).toBe(0);
  });
});

describe("classifyChatEntry", () => {
  it("never carries the text for a correct entry", () => {
    const c = classifyChatEntry({ playerId: "p_a", correct: true, text: "no debería estar" });
    expect(c.type).toBe("acierto");
    expect(c.text).toBeUndefined();
  });
  it("keeps text for a wrong guess", () => {
    const g = classifyChatEntry({ playerId: "p_a", correct: false, text: "perro" });
    expect(g).toEqual({ type: "guess", playerId: "p_a", text: "perro" });
  });
});

describe("maskWord", () => {
  it("masks letters and keeps spaces", () => {
    expect(maskWord("perro")).toBe("_____");
    expect(maskWord("el padrino")).toBe("__ _______");
  });
  it("handles empty", () => {
    expect(maskWord("")).toBe("");
  });
});

describe("buildPictionaryInitialState", () => {
  it("returns correct gameType and defaults", () => {
    const s = buildPictionaryInitialState();
    expect(s.gameType).toBe("pictionary");
    expect(s.pictionaryConfig.roundsPerPlayer).toBe(2);
    expect(s.pictionaryConfig.drawSeconds).toBe(80);
    expect(s.pictionaryConfig.categoria).toBe("mixto");
    expect(s.selectorIndex).toBe(0);
    expect(s.roundsCompleted).toBe(0);
    expect(s.currentRound).toBeNull();
  });

  it("applies custom config", () => {
    const s = buildPictionaryInitialState({ roundsPerPlayer: 3, drawSeconds: 120, categoria: "pelis" });
    expect(s.pictionaryConfig).toEqual({ roundsPerPlayer: 3, drawSeconds: 120, categoria: "pelis" });
  });

  it("does not share pictionaryConfig reference between calls", () => {
    const a = buildPictionaryInitialState();
    const b = buildPictionaryInitialState();
    a.pictionaryConfig.roundsPerPlayer = 99;
    expect(b.pictionaryConfig.roundsPerPlayer).toBe(2);
  });
});
