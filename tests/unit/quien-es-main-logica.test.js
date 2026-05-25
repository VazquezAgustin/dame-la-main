import { describe, it, expect } from "vitest";
import {
  POINTS_PER_CORRECT,
  calcRoundScore,
  isGameOver,
  nextSelectorIndex,
  buildQuienInitialState,
} from "../../js/games/quien-es-main/logica.js";

describe("POINTS_PER_CORRECT", () => {
  it("is 100", () => {
    expect(POINTS_PER_CORRECT).toBe(100);
  });
});

describe("calcRoundScore", () => {
  it("returns 0 for empty results", () => {
    expect(calcRoundScore({})).toBe(0);
    expect(calcRoundScore()).toBe(0);
  });

  it("counts only correctos", () => {
    const results = {
      0: { famoso: "Messi",   result: "correcto" },
      1: { famoso: "Ronaldo", result: "paso" },
      2: { famoso: "Shakira", result: "correcto" },
    };
    expect(calcRoundScore(results)).toBe(200);
  });

  it("returns 0 when all are pasos", () => {
    const results = {
      0: { famoso: "A", result: "paso" },
      1: { famoso: "B", result: "paso" },
    };
    expect(calcRoundScore(results)).toBe(0);
  });

  it("multiplies by POINTS_PER_CORRECT", () => {
    const results = {
      0: { famoso: "A", result: "correcto" },
      1: { famoso: "B", result: "correcto" },
      2: { famoso: "C", result: "correcto" },
    };
    expect(calcRoundScore(results)).toBe(3 * POINTS_PER_CORRECT);
  });

  it("does not mutate the input", () => {
    const results = { 0: { famoso: "X", result: "correcto" } };
    const copy = JSON.stringify(results);
    calcRoundScore(results);
    expect(JSON.stringify(results)).toBe(copy);
  });
});

describe("isGameOver", () => {
  it("returns false when rounds remaining", () => {
    expect(isGameOver(1, 2, 3)).toBe(false); // 1 done, need 6
  });

  it("returns true when exactly at total", () => {
    expect(isGameOver(6, 2, 3)).toBe(true); // 2 rounds × 3 players = 6
  });

  it("returns true when exceeded total", () => {
    expect(isGameOver(7, 2, 3)).toBe(true);
  });

  it("returns true after 1 round with 1 player and 1 round per player", () => {
    expect(isGameOver(1, 1, 1)).toBe(true);
  });

  it("returns false at 0 rounds completed", () => {
    expect(isGameOver(0, 2, 4)).toBe(false);
  });
});

describe("nextSelectorIndex", () => {
  it("increments normally", () => {
    expect(nextSelectorIndex(0, 3)).toBe(1);
    expect(nextSelectorIndex(1, 3)).toBe(2);
  });

  it("wraps around at end", () => {
    expect(nextSelectorIndex(2, 3)).toBe(0);
  });

  it("handles single player", () => {
    expect(nextSelectorIndex(0, 1)).toBe(0);
  });

  it("returns 0 for zero playerCount (safe fallback)", () => {
    expect(nextSelectorIndex(0, 0)).toBe(0);
  });
});

describe("buildQuienInitialState", () => {
  it("returns correct gameType", () => {
    expect(buildQuienInitialState().gameType).toBe("quien-es-main");
  });

  it("applies defaults", () => {
    const s = buildQuienInitialState();
    expect(s.quienConfig.roundsPerPlayer).toBe(2);
    expect(s.quienConfig.famososPerRound).toBe(8);
    expect(s.quienConfig.roundDuration).toBe(60);
    expect(s.selectorIndex).toBe(0);
    expect(s.roundsCompleted).toBe(0);
    expect(s.currentRound).toBeNull();
  });

  it("applies custom config", () => {
    const s = buildQuienInitialState({ roundsPerPlayer: 3, famososPerRound: 5, roundDuration: 45 });
    expect(s.quienConfig.roundsPerPlayer).toBe(3);
    expect(s.quienConfig.famososPerRound).toBe(5);
    expect(s.quienConfig.roundDuration).toBe(45);
  });

  it("does not share quienConfig reference between calls", () => {
    const a = buildQuienInitialState();
    const b = buildQuienInitialState();
    a.quienConfig.roundsPerPlayer = 99;
    expect(b.quienConfig.roundsPerPlayer).toBe(2);
  });
});
