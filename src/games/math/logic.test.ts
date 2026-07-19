import { describe, it, expect } from "vitest";
import { generateProblem, isCorrect, LEVELS, type MathLevel } from "./logic";

function lcg(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (1664525 * s + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

const LEVEL_IDS: MathLevel[] = ["up5", "up10", "up20", "mult"];

describe("math quiz logic", () => {
  for (const level of LEVEL_IDS) {
    const { min, max, kind } = LEVELS[level];

    it(`[${level}] operands, answer, and choices all stay within ${min}..${max}`, () => {
      const rng = lcg(level.length * 7 + 1);
      for (let i = 0; i < 500; i++) {
        const p = generateProblem(level, rng);
        expect(p.level).toBe(level);
        // Answer in range.
        expect(p.answer).toBeGreaterThanOrEqual(min);
        expect(p.answer).toBeLessThanOrEqual(max);
        // Arithmetic is consistent with the operator.
        if (p.op === "+") expect(p.a + p.b).toBe(p.answer);
        else if (p.op === "-") expect(p.a - p.b).toBe(p.answer);
        else expect(p.a * p.b).toBe(p.answer);
        // Choices: include the answer, unique, in range.
        expect(p.choices).toContain(p.answer);
        expect(new Set(p.choices).size).toBe(p.choices.length);
        expect(p.choices.length).toBe(3);
        for (const c of p.choices) {
          expect(c).toBeGreaterThanOrEqual(min);
          expect(c).toBeLessThanOrEqual(max);
        }
      }
    });

    it(`[${level}] uses only the ${kind === "mult" ? "× operator" : "+ and - operators"}`, () => {
      const rng = lcg(level.length * 13 + 3);
      const ops = new Set<string>();
      for (let i = 0; i < 200; i++) ops.add(generateProblem(level, rng).op);
      if (kind === "mult") {
        expect([...ops]).toEqual(["×"]);
      } else {
        expect(ops.has("+")).toBe(true);
        expect(ops.has("-")).toBe(true);
        expect(ops.has("×")).toBe(false);
      }
    });
  }

  it("mult keeps operands within 1..5", () => {
    const rng = lcg(99);
    for (let i = 0; i < 300; i++) {
      const p = generateProblem("mult", rng);
      expect(p.a).toBeGreaterThanOrEqual(1);
      expect(p.a).toBeLessThanOrEqual(5);
      expect(p.b).toBeGreaterThanOrEqual(1);
      expect(p.b).toBeLessThanOrEqual(5);
    }
  });

  it("defaults to up10 when no level is given", () => {
    const p = generateProblem(undefined, lcg(5));
    expect(p.level).toBe("up10");
  });

  it("isCorrect matches only the answer", () => {
    const p = generateProblem("up10", lcg(3));
    expect(isCorrect(p, p.answer)).toBe(true);
    const wrong = p.choices.find((c) => c !== p.answer)!;
    expect(isCorrect(p, wrong)).toBe(false);
  });
});
