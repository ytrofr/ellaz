import { describe, it, expect } from "vitest";
import { newGame, reveal, toggleFlag, placeMines, DIFFICULTIES, type MineState } from "./logic";

function countMines(s: MineState): number {
  let n = 0;
  for (const row of s.grid) for (const c of row) if (c.mine) n++;
  return n;
}

describe("minesweeper logic", () => {
  it("creates an unplaced board of the right size", () => {
    const s = newGame(DIFFICULTIES.easy);
    expect(s.grid.length).toBe(9);
    expect(s.grid[0].length).toBe(9);
    expect(s.placed).toBe(false);
    expect(countMines(s)).toBe(0);
  });

  it("first reveal places mines and is always safe", () => {
    const s = reveal(newGame(DIFFICULTIES.easy), 4, 4, () => 0.5);
    expect(s.placed).toBe(true);
    expect(countMines(s)).toBe(10);
    expect(s.grid[4][4].mine).toBe(false);
    expect(s.grid[4][4].revealed).toBe(true);
    expect(s.dead).toBe(false);
  });

  it("hard: places the right mine count and keeps the first click safe", () => {
    const d = DIFFICULTIES.hard;
    expect(d.rows).toBe(14);
    expect(d.cols).toBe(14);
    const s = reveal(newGame(d), 7, 7, () => 0.5);
    expect(s.placed).toBe(true);
    expect(countMines(s)).toBe(40);
    // first-click cell and all its neighbors must be mine-free
    for (let dr = -1; dr <= 1; dr++)
      for (let dc = -1; dc <= 1; dc++) expect(s.grid[7 + dr][7 + dc].mine).toBe(false);
    expect(s.grid[7][7].revealed).toBe(true);
    expect(s.dead).toBe(false);
  });

  it("does not place a mine on the first-click cell or its neighbors", () => {
    const s = placeMines(newGame(DIFFICULTIES.medium), 5, 5, () => 0.999);
    for (let dr = -1; dr <= 1; dr++)
      for (let dc = -1; dc <= 1; dc++) expect(s.grid[5 + dr][5 + dc].mine).toBe(false);
  });

  it("flood-fills empty regions on reveal", () => {
    // A tiny board with a single mine in the corner; revealing the far corner
    // should open a large connected region.
    let s = newGame({ rows: 5, cols: 5, mines: 1 });
    s = placeMines(s, 4, 4, () => 0); // rng=0 → mine goes to first candidate (top-left area, not near 4,4)
    s = reveal(s, 4, 4, () => 0);
    const revealedCount = s.grid.flat().filter((c) => c.revealed).length;
    expect(revealedCount).toBeGreaterThan(1); // flood opened more than the clicked cell
  });

  it("stepping on a mine ends the game and reveals all mines", () => {
    let s = placeMines(newGame(DIFFICULTIES.easy), 0, 0, () => 0.5);
    // find a mine and reveal it
    let mine: [number, number] | null = null;
    for (let r = 0; r < s.rows && !mine; r++)
      for (let c = 0; c < s.cols; c++) if (s.grid[r][c].mine) { mine = [r, c]; break; }
    s = reveal(s, mine![0], mine![1], () => 0.5);
    expect(s.dead).toBe(true);
    expect(s.grid[mine![0]][mine![1]].revealed).toBe(true);
  });

  it("toggles flags and adjusts the counter", () => {
    let s = newGame(DIFFICULTIES.easy);
    s = toggleFlag(s, 2, 2);
    expect(s.grid[2][2].flagged).toBe(true);
    expect(s.flagsLeft).toBe(9);
    s = toggleFlag(s, 2, 2);
    expect(s.grid[2][2].flagged).toBe(false);
    expect(s.flagsLeft).toBe(10);
  });

  it("wins when all non-mine cells are revealed", () => {
    // 2x2 with 1 mine: reveal the 3 safe cells → win.
    let s = newGame({ rows: 2, cols: 2, mines: 1 });
    s = placeMines(s, 0, 0, () => 0); // mine avoids (0,0)+neighbors → but all cells are neighbors of (0,0)
    // With a 2x2 board every cell neighbors (0,0), so placeMines can't place → 0 mines.
    // Instead hand-place a mine to test win.
    s.grid[1][1].mine = true;
    s.placed = true;
    s = reveal(s, 0, 0, () => 0);
    // reveal remaining safe cells explicitly
    s = reveal(s, 0, 1, () => 0);
    s = reveal(s, 1, 0, () => 0);
    expect(s.won).toBe(true);
  });
});
