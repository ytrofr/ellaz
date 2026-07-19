import { describe, it, expect } from "vitest";
import { generateProblem, isCorrect } from "./logic";

function lcg(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (1664525 * s + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

describe("math quiz logic", () => {
  it("addition never exceeds 10 and subtraction never goes negative", () => {
    const rng = lcg(1);
    for (let i = 0; i < 500; i++) {
      const p = generateProblem(rng);
      expect(p.a).toBeGreaterThanOrEqual(0);
      expect(p.a).toBeLessThanOrEqual(10);
      expect(p.b).toBeGreaterThanOrEqual(0);
      expect(p.answer).toBeGreaterThanOrEqual(0);
      expect(p.answer).toBeLessThanOrEqual(10);
      if (p.op === "+") expect(p.a + p.b).toBe(p.answer);
      else expect(p.a - p.b).toBe(p.answer);
    }
  });

  it("choices include the answer, are unique, and in range 0..10", () => {
    const rng = lcg(9);
    for (let i = 0; i < 200; i++) {
      const p = generateProblem(rng);
      expect(p.choices).toContain(p.answer);
      expect(new Set(p.choices).size).toBe(p.choices.length);
      expect(p.choices.length).toBe(3);
      for (const c of p.choices) {
        expect(c).toBeGreaterThanOrEqual(0);
        expect(c).toBeLessThanOrEqual(10);
      }
    }
  });

  it("isCorrect matches only the answer", () => {
    const p = generateProblem(lcg(3));
    expect(isCorrect(p, p.answer)).toBe(true);
    const wrong = p.choices.find((c) => c !== p.answer)!;
    expect(isCorrect(p, wrong)).toBe(false);
  });

  it("produces both operations over many draws", () => {
    const rng = lcg(42);
    const ops = new Set<string>();
    for (let i = 0; i < 50; i++) ops.add(generateProblem(rng).op);
    expect(ops.has("+")).toBe(true);
    expect(ops.has("-")).toBe(true);
  });
});
