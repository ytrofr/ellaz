// 2048 — pure game logic. No DOM, no framework. Deterministic given a RNG.
// Reference mechanics: gabrielecirulli/2048 (MIT). Original engine, our own code.
//
// Board size is a parameter (default 4). Every function reads the grid's own
// dimensions (grid.length) so an NxN board of any size works — see LEVELS.

export type Grid = number[][]; // 0 = empty
export type Direction = "up" | "down" | "left" | "right";
export const SIZE = 4; // default/classic board size

// Difficulty levels: board size + win target.
export interface Level {
  size: number;
  target: number;
}
export type LevelKey = "kids" | "classic" | "hard";
export const LEVELS: Record<LevelKey, Level> = {
  kids: { size: 5, target: 256 }, // roomier, easier
  classic: { size: 4, target: 2048 }, // standard
  hard: { size: 3, target: 512 }, // tight
};

export interface MoveResult {
  grid: Grid;
  moved: boolean;
  gained: number; // score gained this move
  merged: Array<[number, number]>; // cells (row,col) that received a merge (for juice)
}

export function emptyGrid(size: number = SIZE): Grid {
  return Array.from({ length: size }, () => Array<number>(size).fill(0));
}

export function cloneGrid(g: Grid): Grid {
  return g.map((row) => row.slice());
}

export function emptyCells(g: Grid): Array<[number, number]> {
  const out: Array<[number, number]> = [];
  for (let r = 0; r < g.length; r++)
    for (let c = 0; c < g.length; c++) if (g[r][c] === 0) out.push([r, c]);
  return out;
}

/** Spawn a tile (2 with 90% chance, else 4) at a random empty cell. */
export function spawn(g: Grid, rng: () => number = Math.random): Grid {
  const cells = emptyCells(g);
  if (cells.length === 0) return g;
  const [r, c] = cells[Math.floor(rng() * cells.length)];
  const next = cloneGrid(g);
  next[r][c] = rng() < 0.9 ? 2 : 4;
  return next;
}

// Slide + merge one row to the left. Returns the new row, points gained, and
// the indices that received a merge. Pads back to the row's own length.
function collapseRow(row: number[]): { row: number[]; gained: number; mergedAt: number[] } {
  const size = row.length;
  const nums = row.filter((n) => n !== 0);
  const out: number[] = [];
  const mergedAt: number[] = [];
  let gained = 0;
  for (let i = 0; i < nums.length; i++) {
    if (i + 1 < nums.length && nums[i] === nums[i + 1]) {
      const v = nums[i] * 2;
      out.push(v);
      gained += v;
      mergedAt.push(out.length - 1);
      i++; // consume the pair
    } else {
      out.push(nums[i]);
    }
  }
  while (out.length < size) out.push(0);
  return { row: out, gained, mergedAt };
}

function rowsEqual(a: number[], b: number[]): boolean {
  return a.every((v, i) => v === b[i]);
}

// Transform helpers so every direction reuses collapseRow (left). NxN aware.
function transpose(g: Grid): Grid {
  const n = g.length;
  const out = emptyGrid(n);
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) out[c][r] = g[r][c];
  return out;
}
function reverseRows(g: Grid): Grid {
  return g.map((row) => row.slice().reverse());
}

export function move(g: Grid, dir: Direction): MoveResult {
  const n = g.length;
  // Map every direction onto "left" via transpose/reverse, collapse, map back.
  let work = cloneGrid(g);
  if (dir === "up") work = transpose(work);
  if (dir === "down") work = reverseRows(transpose(work));
  if (dir === "right") work = reverseRows(work);

  let gained = 0;
  const mergedLeftSpace: Array<[number, number]> = [];
  const collapsed = work.map((row, r) => {
    const res = collapseRow(row);
    gained += res.gained;
    res.mergedAt.forEach((c) => mergedLeftSpace.push([r, c]));
    return res.row;
  });

  // Map grid + merged coords back to original orientation.
  let result = collapsed;
  const mapCoord = (r: number, c: number): [number, number] => {
    if (dir === "up") return [c, r];
    if (dir === "down") return [n - 1 - c, r];
    if (dir === "right") return [r, n - 1 - c];
    return [r, c];
  };
  const merged = mergedLeftSpace.map(([r, c]) => mapCoord(r, c));

  if (dir === "up") result = transpose(result);
  if (dir === "down") result = transpose(reverseRows(result));
  if (dir === "right") result = reverseRows(result);

  const moved = !g.every((row, r) => rowsEqual(row, result[r]));
  return { grid: result, moved, gained, merged };
}

export function hasMoves(g: Grid): boolean {
  const n = g.length;
  if (emptyCells(g).length > 0) return true;
  for (let r = 0; r < n; r++)
    for (let c = 0; c < n; c++) {
      if (c + 1 < n && g[r][c] === g[r][c + 1]) return true;
      if (r + 1 < n && g[r][c] === g[r + 1][c]) return true;
    }
  return false;
}

export function hasWon(g: Grid, target = 2048): boolean {
  return g.some((row) => row.some((v) => v >= target));
}

export function newGame(size: number = SIZE, rng: () => number = Math.random): Grid {
  return spawn(spawn(emptyGrid(size), rng), rng);
}
