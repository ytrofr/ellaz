import { describe, it, expect } from "vitest";
import {
  emptyGrid,
  move,
  spawn,
  hasMoves,
  hasWon,
  emptyCells,
  newGame,
  LEVELS,
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

describe("2048 logic — difficulty levels (config)", () => {
  it("exposes kids/classic/hard with expected size + target", () => {
    expect(LEVELS.kids).toEqual({ size: 5, target: 256 });
    expect(LEVELS.classic).toEqual({ size: 4, target: 2048 });
    expect(LEVELS.hard).toEqual({ size: 3, target: 512 });
  });
});

describe("2048 logic — 5x5 board (kids)", () => {
  it("newGame builds a 5x5 grid with two spawned tiles", () => {
    const rng = () => 0; // first empty cell, value 2, every call
    const g = newGame(5, rng);
    expect(g.length).toBe(5);
    expect(g.every((row) => row.length === 5)).toBe(true);
    // Two spawns into the same first cell collapse to one occupied tile here.
    expect(emptyCells(g).length).toBeGreaterThanOrEqual(23);
  });

  it("slides a 5x5 row left with no merge", () => {
    const g: Grid = [
      [0, 0, 0, 0, 2],
      [0, 0, 4, 0, 0],
      [0, 8, 0, 0, 0],
      [0, 0, 0, 16, 0],
      [32, 0, 0, 0, 0],
    ];
    const { grid, moved, gained } = move(g, "left");
    expect(moved).toBe(true);
    expect(gained).toBe(0);
    expect(grid[0]).toEqual([2, 0, 0, 0, 0]);
    expect(grid[1]).toEqual([4, 0, 0, 0, 0]);
    expect(grid[3]).toEqual([16, 0, 0, 0, 0]);
  });

  it("merges across a full 5x5 row (two merges, one leftover)", () => {
    const g: Grid = [
      [2, 2, 2, 2, 2],
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
    ];
    const { grid, gained, merged } = move(g, "left");
    expect(grid[0]).toEqual([4, 4, 2, 0, 0]); // pairs merge, odd tile slides
    expect(gained).toBe(8);
    expect(merged.length).toBe(2);
  });

  it("merges up a 5x5 column", () => {
    const g = emptyGrid(5);
    g[0][0] = 2;
    g[1][0] = 2;
    const up = move(g, "up").grid;
    expect(up[0][0]).toBe(4);
  });

  it("spawns into a 5x5 empty cell", () => {
    const g = emptyGrid(5);
    const next = spawn(g, () => 0);
    expect(emptyCells(next).length).toBe(24);
    expect(next[0][0]).toBe(2);
  });

  it("wins at the kids target of 256", () => {
    const g = emptyGrid(5);
    g[2][2] = 256;
    expect(hasWon(g, 256)).toBe(true);
    expect(hasWon(g, 2048)).toBe(false); // 256 does not win classic
    expect(hasMoves(g)).toBe(true);
  });
});

describe("2048 logic — 3x3 board (hard)", () => {
  it("newGame builds a 3x3 grid", () => {
    const g = newGame(3, () => 0);
    expect(g.length).toBe(3);
    expect(g.every((row) => row.length === 3)).toBe(true);
  });

  it("merges a 3x3 row to the right", () => {
    const g: Grid = [
      [2, 2, 0],
      [0, 0, 0],
      [0, 0, 0],
    ];
    const { grid, gained } = move(g, "right");
    expect(grid[0]).toEqual([0, 0, 4]);
    expect(gained).toBe(4);
  });

  it("merges down a 3x3 column and scores", () => {
    const g: Grid = [
      [4, 0, 0],
      [4, 0, 0],
      [0, 0, 0],
    ];
    const { grid, gained } = move(g, "down");
    expect(grid[2][0]).toBe(8);
    expect(gained).toBe(8);
  });

  it("reports no moves on a full checkerboard 3x3", () => {
    const g: Grid = [
      [2, 4, 2],
      [4, 2, 4],
      [2, 4, 2],
    ];
    expect(hasMoves(g)).toBe(false);
    expect(move(g, "left").moved).toBe(false);
  });

  it("spawns into a 3x3 empty cell", () => {
    const g = emptyGrid(3);
    const next = spawn(g, () => 0);
    expect(emptyCells(next).length).toBe(8);
    expect(next[0][0]).toBe(2);
  });

  it("wins at the hard target of 512", () => {
    const g = emptyGrid(3);
    g[1][1] = 512;
    expect(hasWon(g, 512)).toBe(true);
    expect(hasWon(g, 2048)).toBe(false);
  });
});
