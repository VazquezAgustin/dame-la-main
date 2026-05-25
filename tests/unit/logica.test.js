import { describe, it, expect } from "vitest";
import {
  generateRoomCode,
  isBoardComplete,
  countAnsweredCells,
  esc,
  categoryHasUnplayed,
  availableCategories,
  rebalanceLengths,
} from "../../js/logica.js";

const VALID_CHARS = new Set("ABCDEFGHJKLMNPQRSTUVWXYZ23456789");
const BOUNDS = {
  base:       { min: 6,  max: 30 },
  lightning:  { min: 0,  max: 24 },
  estimacion: { min: 0,  max: 24 },
};
const TOTAL = 30;
const CATEGORIES = ["Cat A", "Cat B"];

function emptyBoard(categories) {
  const board = {};
  categories.forEach(cat => {
    board[cat] = { "200": false, "400": false, "600": false, "800": false, "1000": false };
  });
  return board;
}

function fullBoard(categories) {
  const board = {};
  categories.forEach(cat => {
    board[cat] = { "200": true, "400": true, "600": true, "800": true, "1000": true };
  });
  return board;
}

// ── generateRoomCode ──────────────────────────────────────────
describe("generateRoomCode", () => {
  it("produces a 6-character string", () => {
    for (let i = 0; i < 50; i++) {
      expect(generateRoomCode()).toHaveLength(6);
    }
  });

  it("uses only characters from the allowed set", () => {
    for (let i = 0; i < 100; i++) {
      const code = generateRoomCode();
      for (const ch of code) expect(VALID_CHARS.has(ch), `invalid char: ${ch}`).toBe(true);
    }
  });

  it("does not produce ambiguous characters (0, O, 1, I)", () => {
    for (let i = 0; i < 200; i++) {
      const code = generateRoomCode();
      expect(code).not.toMatch(/[01OI]/);
    }
  });
});

// ── isBoardComplete ───────────────────────────────────────────
describe("isBoardComplete", () => {
  it("returns false for empty board", () => {
    expect(isBoardComplete(emptyBoard(CATEGORIES), CATEGORIES)).toBe(false);
  });

  it("returns false for partially completed board", () => {
    const board = emptyBoard(CATEGORIES);
    board["Cat A"]["200"] = true;
    expect(isBoardComplete(board, CATEGORIES)).toBe(false);
  });

  it("returns true when all cells are played", () => {
    expect(isBoardComplete(fullBoard(CATEGORIES), CATEGORIES)).toBe(true);
  });

  it("returns false if one cell remains", () => {
    const board = fullBoard(CATEGORIES);
    board["Cat B"]["1000"] = false;
    expect(isBoardComplete(board, CATEGORIES)).toBe(false);
  });

  it("returns false for null board", () => {
    expect(isBoardComplete(null, CATEGORIES)).toBe(false);
  });

  it("returns false for null categories", () => {
    expect(isBoardComplete(fullBoard(CATEGORIES), null)).toBe(false);
  });

  it("returns false for undefined inputs", () => {
    expect(isBoardComplete(undefined, undefined)).toBe(false);
  });
});

// ── countAnsweredCells ────────────────────────────────────────
describe("countAnsweredCells", () => {
  it("returns 0 for empty board", () => {
    expect(countAnsweredCells(emptyBoard(CATEGORIES), CATEGORIES)).toBe(0);
  });

  it("returns total cells for fully played board", () => {
    expect(countAnsweredCells(fullBoard(CATEGORIES), CATEGORIES)).toBe(10); // 2 cats × 5 values
  });

  it("counts only cells explicitly set to true", () => {
    const board = emptyBoard(CATEGORIES);
    board["Cat A"]["200"] = true;
    board["Cat A"]["600"] = true;
    expect(countAnsweredCells(board, CATEGORIES)).toBe(2);
  });

  it("returns 0 for null/undefined inputs", () => {
    expect(countAnsweredCells(null, CATEGORIES)).toBe(0);
    expect(countAnsweredCells(emptyBoard(CATEGORIES), null)).toBe(0);
  });
});

// ── esc ───────────────────────────────────────────────────────
describe("esc", () => {
  it("escapes ampersand", () => {
    expect(esc("a & b")).toBe("a &amp; b");
  });

  it("escapes less-than", () => {
    expect(esc("<script>")).toBe("&lt;script&gt;");
  });

  it("escapes double quotes", () => {
    expect(esc('"quoted"')).toBe("&quot;quoted&quot;");
  });

  it("escapes all four characters together", () => {
    expect(esc('&<>"')).toBe("&amp;&lt;&gt;&quot;");
  });

  it("does not modify normal strings", () => {
    expect(esc("hello world")).toBe("hello world");
  });

  it("coerces non-strings to string", () => {
    expect(esc(42)).toBe("42");
    expect(esc(null)).toBe("null");
  });
});

// ── categoryHasUnplayed ───────────────────────────────────────
describe("categoryHasUnplayed", () => {
  it("returns true when all cells are unplayed", () => {
    expect(categoryHasUnplayed({}, "Cat A")).toBe(true);
  });

  it("returns true when at least one cell is unplayed", () => {
    const board = { "Cat A": { "200": true, "400": true, "600": true, "800": true, "1000": false } };
    expect(categoryHasUnplayed(board, "Cat A")).toBe(true);
  });

  it("returns false when all cells are played", () => {
    const board = { "Cat A": { "200": true, "400": true, "600": true, "800": true, "1000": true } };
    expect(categoryHasUnplayed(board, "Cat A")).toBe(false);
  });

  it("handles null board gracefully", () => {
    expect(categoryHasUnplayed(null, "Cat A")).toBe(true);
  });
});

// ── availableCategories ───────────────────────────────────────
describe("availableCategories", () => {
  it("returns all categories on empty board", () => {
    const state = { categories: ["A", "B", "C"], board: {} };
    expect(availableCategories(state)).toEqual(["A", "B", "C"]);
  });

  it("excludes fully played categories", () => {
    const state = {
      categories: ["A", "B"],
      board: {
        A: { "200": true, "400": true, "600": true, "800": true, "1000": true },
        B: {},
      },
    };
    expect(availableCategories(state)).toEqual(["B"]);
  });

  it("returns empty array when all categories are done", () => {
    const state = {
      categories: ["A"],
      board: { A: { "200": true, "400": true, "600": true, "800": true, "1000": true } },
    };
    expect(availableCategories(state)).toEqual([]);
  });

  it("handles missing board/categories gracefully", () => {
    expect(availableCategories({})).toEqual([]);
  });
});

// ── rebalanceLengths ──────────────────────────────────────────
describe("rebalanceLengths", () => {
  function sumOf(state) {
    return Object.values(state).reduce((a, b) => a + b, 0);
  }

  const initial = { base: 18, lightning: 6, estimacion: 6 };

  it("sum remains at TOTAL after moving base slider up", () => {
    const next = rebalanceLengths(initial, BOUNDS, "base", 24);
    expect(sumOf(next)).toBe(TOTAL);
  });

  it("sum remains at TOTAL after moving base slider down", () => {
    const next = rebalanceLengths(initial, BOUNDS, "base", 10);
    expect(sumOf(next)).toBe(TOTAL);
  });

  it("respects min bounds for changed slot", () => {
    const next = rebalanceLengths(initial, BOUNDS, "lightning", -5);
    expect(next.lightning).toBeGreaterThanOrEqual(BOUNDS.lightning.min);
  });

  it("respects max bounds for changed slot", () => {
    const next = rebalanceLengths(initial, BOUNDS, "base", 99);
    expect(next.base).toBeLessThanOrEqual(BOUNDS.base.max);
  });

  it("all slots remain within their bounds after any change", () => {
    const cases = [
      ["base", 6], ["base", 30], ["lightning", 0], ["lightning", 20], ["estimacion", 12],
    ];
    for (const [slot, val] of cases) {
      const next = rebalanceLengths(initial, BOUNDS, slot, val);
      for (const [k, v] of Object.entries(next)) {
        expect(v, `${k}=${v} out of bounds for slot=${slot} val=${val}`)
          .toBeGreaterThanOrEqual(BOUNDS[k].min);
        expect(v, `${k}=${v} out of bounds for slot=${slot} val=${val}`)
          .toBeLessThanOrEqual(BOUNDS[k].max);
      }
    }
  });

  it("does not mutate the input state", () => {
    const state = { base: 18, lightning: 6, estimacion: 6 };
    rebalanceLengths(state, BOUNDS, "base", 24);
    expect(state).toEqual({ base: 18, lightning: 6, estimacion: 6 });
  });

  it("sum remains TOTAL when all room is consumed by one slider", () => {
    // base at max means others must be at min
    const state = { base: 18, lightning: 6, estimacion: 6 };
    const next = rebalanceLengths(state, BOUNDS, "base", 30);
    expect(sumOf(next)).toBe(TOTAL);
    expect(next.base).toBeLessThanOrEqual(BOUNDS.base.max);
  });
});
