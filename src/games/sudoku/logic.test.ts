import { describe, it, expect } from "vitest";
import { generate, isValid, countSolutions, setCell, conflicts, isSolved } from "./logic";

// A small deterministic-ish RNG (LCG) so generation is reproducible in tests.
function lcg(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (1664525 * s + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

describe("sudoku logic", () => {
  it("generates a puzzle with a unique solution", () => {
    const st = generate("easy", lcg(42));
    // every given matches the solution
    for (let r = 0; r < 9; r++)
      for (let c = 0; c < 9; c++)
        if (st.given[r][c]) expect(st.puzzle[r][c]).toBe(st.solution[r][c]);
    // the puzzle itself is uniquely solvable
    expect(countSolutions(st.puzzle.map((row) => row.slice()), 2)).toBe(1);
  });

  it("generates an expert puzzle with a unique solution and valid solution grid", () => {
    const st = generate("expert", lcg(99));
    // every given matches the solution
    for (let r = 0; r < 9; r++)
      for (let c = 0; c < 9; c++)
        if (st.given[r][c]) expect(st.puzzle[r][c]).toBe(st.solution[r][c]);
    // the puzzle itself is uniquely solvable
    expect(countSolutions(st.puzzle.map((row) => row.slice()), 2)).toBe(1);
    // the solution is a complete valid grid
    for (let r = 0; r < 9; r++)
      for (let c = 0; c < 9; c++) {
        const v = st.solution[r][c];
        expect(v).toBeGreaterThanOrEqual(1);
        st.solution[r][c] = 0;
        expect(isValid(st.solution, r, c, v)).toBe(true);
        st.solution[r][c] = v;
      }
    // expert has no more givens than hard (fewer clues = harder)
    const givenCount = st.given.reduce((n, row) => n + row.filter(Boolean).length, 0);
    expect(givenCount).toBeLessThanOrEqual(30);
  });

  it("the solution is a valid complete grid", () => {
    const st = generate("easy", lcg(7));
    for (let r = 0; r < 9; r++)
      for (let c = 0; c < 9; c++) {
        const v = st.solution[r][c];
        expect(v).toBeGreaterThanOrEqual(1);
        st.solution[r][c] = 0;
        expect(isValid(st.solution, r, c, v)).toBe(true);
        st.solution[r][c] = v;
      }
  });

  it("does not let a player overwrite a given cell", () => {
    const st = generate("easy", lcg(3));
    let gr = -1, gc = -1;
    outer: for (let r = 0; r < 9; r++)
      for (let c = 0; c < 9; c++) if (st.given[r][c]) { gr = r; gc = c; break outer; }
    const after = setCell(st, gr, gc, 5);
    expect(after.puzzle[gr][gc]).toBe(st.puzzle[gr][gc]); // unchanged
  });

  it("flags conflicts and detects a solved board", () => {
    const st = generate("easy", lcg(11));
    expect(isSolved(st)).toBe(false);
    // fill the whole grid from the solution → solved, no conflicts
    let full = st;
    for (let r = 0; r < 9; r++)
      for (let c = 0; c < 9; c++) if (!full.given[r][c]) full = setCell(full, r, c, st.solution[r][c]);
    expect(conflicts(full).size).toBe(0);
    expect(isSolved(full)).toBe(true);
  });

  it("detects a conflicting entry", () => {
    const st = generate("easy", lcg(5));
    // find an empty cell and a filled peer in its row to force a conflict
    let er = -1, ec = -1;
    outer: for (let r = 0; r < 9; r++)
      for (let c = 0; c < 9; c++) if (!st.given[r][c] && st.puzzle[r][c] === 0) { er = r; ec = c; break outer; }
    // pick the value of some given in the same row
    const rowGiven = st.puzzle[er].find((v) => v !== 0)!;
    const bad = setCell(st, er, ec, rowGiven);
    expect(conflicts(bad).has(`${er},${ec}`)).toBe(true);
  });
});
