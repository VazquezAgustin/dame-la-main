import { describe, it, expect } from "vitest";
import {
  CATEGORY_POOL,
  QUESTIONS,
  LIGHTNING_QUESTIONS,
  ESTIMATION_QUESTIONS,
  pickRandomCategories,
} from "../../js/preguntas.js";

const VALUES = [200, 400, 600, 800, 1000];

// ── pickRandomCategories ──────────────────────────────────────
describe("pickRandomCategories", () => {
  it("returns the requested count", () => {
    expect(pickRandomCategories(CATEGORY_POOL, 6)).toHaveLength(6);
    expect(pickRandomCategories(CATEGORY_POOL, 3)).toHaveLength(3);
  });

  it("returned categories are a subset of the pool", () => {
    const picked = pickRandomCategories(CATEGORY_POOL, 6);
    picked.forEach(cat => expect(CATEGORY_POOL).toContain(cat));
  });

  it("does not return duplicates", () => {
    for (let i = 0; i < 20; i++) {
      const picked = pickRandomCategories(CATEGORY_POOL, 6);
      expect(new Set(picked).size).toBe(6);
    }
  });

  it("excludes categories in the exclude list", () => {
    const exclude = CATEGORY_POOL.slice(0, 4);
    for (let i = 0; i < 20; i++) {
      const picked = pickRandomCategories(CATEGORY_POOL, 6, exclude);
      exclude.forEach(cat => expect(picked).not.toContain(cat));
    }
  });

  it("falls back to full pool when filtered pool is smaller than count", () => {
    const hugeExclude = CATEGORY_POOL.slice(0, CATEGORY_POOL.length - 2);
    const picked = pickRandomCategories(CATEGORY_POOL, 6, hugeExclude);
    expect(picked).toHaveLength(6);
  });

  it("does not mutate the pool", () => {
    const original = [...CATEGORY_POOL];
    pickRandomCategories(CATEGORY_POOL, 6);
    expect(CATEGORY_POOL).toEqual(original);
  });
});

// ── CATEGORY_POOL structure ───────────────────────────────────
describe("CATEGORY_POOL", () => {
  it("has at least 12 categories", () => {
    expect(CATEGORY_POOL.length).toBeGreaterThanOrEqual(12);
  });

  it("has no duplicates", () => {
    expect(new Set(CATEGORY_POOL).size).toBe(CATEGORY_POOL.length);
  });

  it("contains only non-empty strings", () => {
    CATEGORY_POOL.forEach(cat => {
      expect(typeof cat).toBe("string");
      expect(cat.length).toBeGreaterThan(0);
    });
  });
});

// ── QUESTIONS bank ────────────────────────────────────────────
describe("QUESTIONS bank", () => {
  it("every pool category has a questions entry", () => {
    CATEGORY_POOL.forEach(cat => {
      expect(QUESTIONS[cat], `missing QUESTIONS["${cat}"]`).toBeDefined();
    });
  });

  it("every category has exactly 5 questions", () => {
    CATEGORY_POOL.forEach(cat => {
      expect(QUESTIONS[cat], `${cat}: expected 5 questions`).toHaveLength(5);
    });
  });

  it("questions cover exactly the values 200, 400, 600, 800, 1000", () => {
    CATEGORY_POOL.forEach(cat => {
      const vals = QUESTIONS[cat].map(q => q.value).sort((a, b) => a - b);
      expect(vals, `${cat}: wrong values`).toEqual(VALUES);
    });
  });

  it("each question has non-empty question and answer fields", () => {
    CATEGORY_POOL.forEach(cat => {
      QUESTIONS[cat].forEach((q, i) => {
        expect(q.question, `${cat}[${i}] missing question`).toBeTruthy();
        expect(q.answer, `${cat}[${i}] missing answer`).not.toBe(undefined);
        expect(String(q.answer).length, `${cat}[${i}] empty answer`).toBeGreaterThan(0);
      });
    });
  });

  it("no duplicate values within a category", () => {
    CATEGORY_POOL.forEach(cat => {
      const vals = QUESTIONS[cat].map(q => q.value);
      expect(new Set(vals).size, `${cat}: duplicate values`).toBe(5);
    });
  });
});

// ── LIGHTNING_QUESTIONS bank ──────────────────────────────────
describe("LIGHTNING_QUESTIONS bank", () => {
  it("is an array with at least 10 questions", () => {
    expect(Array.isArray(LIGHTNING_QUESTIONS)).toBe(true);
    expect(LIGHTNING_QUESTIONS.length).toBeGreaterThanOrEqual(10);
  });

  it("each entry has non-empty question and answer", () => {
    LIGHTNING_QUESTIONS.forEach((q, i) => {
      expect(q.question, `[${i}] missing question`).toBeTruthy();
      expect(q.answer, `[${i}] missing answer`).not.toBe(undefined);
      expect(String(q.answer).length, `[${i}] empty answer`).toBeGreaterThan(0);
    });
  });
});

// ── ESTIMATION_QUESTIONS bank ─────────────────────────────────
describe("ESTIMATION_QUESTIONS bank", () => {
  it("is an array with at least 5 questions", () => {
    expect(Array.isArray(ESTIMATION_QUESTIONS)).toBe(true);
    expect(ESTIMATION_QUESTIONS.length).toBeGreaterThanOrEqual(5);
  });

  it("each entry has non-empty question and numeric answer", () => {
    ESTIMATION_QUESTIONS.forEach((q, i) => {
      expect(q.question, `[${i}] missing question`).toBeTruthy();
      expect(typeof q.answer, `[${i}] answer must be numeric`).toBe("number");
    });
  });
});
