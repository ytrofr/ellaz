import { describe, it, expect } from "vitest";
import {
  emptyGrid,
  move,
  spawn,
  hasMoves,
  hasWon,
  emptyCells,
  type Grid,
} from "./logic";

// A deterministic RNG for reproducible spawn tests.
function seeded(seq: number[]): () => number {
  let i = 0;
  return () => seq[i++ % seq.length];
}

describe("2048 logic", () => {
  it("slides tiles left with no merge", () => {
    const g: Grid = [
      [0, 0, 0, 2],
      [0, 0, 4, 0],
      [0, 8, 0, 0],
      [2, 0, 0, 0],
    ];
    const { grid, moved, gained } = move(g, "left");
    expect(moved).toBe(true);
    expect(gained).toBe(0);
    expect(grid[0]).toEqual([2, 0, 0, 0]);
    expect(grid[1]).toEqual([4, 0, 0, 0]);
    expect(grid[2]).toEqual([8, 0, 0, 0]);
  });

  it("merges equal adjacent tiles once and scores the sum", () => {
    const g: Grid = [
      [2, 2, 2, 2],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ];
    const { grid, gained, merged } = move(g, "left");
    expect(grid[0]).toEqual([4, 4, 0, 0]); // two independent merges, not 8
    expect(gained).toBe(8);
    expect(merged.length).toBe(2);
  });

  it("does not merge a tile twice in one move", () => {
    const g: Grid = [
      [4, 2, 2, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ];
    const { grid } = move(g, "left");
    expect(grid[0]).toEqual([4, 4, 0, 0]);
  });

  it("merges to the right correctly", () => {
    const g: Grid = [
      [2, 2, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ];
    const { grid } = move(g, "right");
    expect(grid[0]).toEqual([0, 0, 0, 4]);
  });

  it("merges up and down columns", () => {
    const g: Grid = [
      [2, 0, 0, 0],
      [2, 0, 0, 0],
      [4, 0, 0, 0],
      [4, 0, 0, 0],
    ];
    const up = move(g, "up").grid;
    expect(up[0][0]).toBe(4);
    expect(up[1][0]).toBe(8);
    const down = move(g, "down").grid;
    expect(down[3][0]).toBe(8);
    expect(down[2][0]).toBe(4);
  });

  it("reports moved=false when nothing changes", () => {
    const g: Grid = [
      [2, 4, 2, 4],
      [4, 2, 4, 2],
      [2, 4, 2, 4],
      [4, 2, 4, 2],
    ];
    expect(move(g, "left").moved).toBe(false);
    expect(hasMoves(g)).toBe(false);
  });

  it("spawns a 2 or 4 into an empty cell", () => {
    const g = emptyGrid();
    const rng = seeded([0, 0]); // first cell, value 2
    const next = spawn(g, rng);
    expect(emptyCells(next).length).toBe(15);
    expect(next[0][0]).toBe(2);
  });

  it("detects a win at 2048", () => {
    const g = emptyGrid();
    g[0][0] = 2048;
    expect(hasWon(g)).toBe(true);
    expect(hasWon(emptyGrid())).toBe(false);
  });
});
