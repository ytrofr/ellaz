// Minesweeper — pure logic. Mines are placed lazily on the first reveal so the
// first click is always safe (classic behavior). Deterministic given a RNG.
export interface Cell {
  mine: boolean;
  revealed: boolean;
  flagged: boolean;
  adj: number; // adjacent mine count (valid once mines are placed)
}
export interface MineState {
  rows: number;
  cols: number;
  mines: number;
  grid: Cell[][];
  placed: boolean; // mines placed yet?
  dead: boolean;
  won: boolean;
  flagsLeft: number;
}

export interface Difficulty {
  rows: number;
  cols: number;
  mines: number;
}
export const DIFFICULTIES: Record<"easy" | "medium" | "hard", Difficulty> = {
  easy: { rows: 9, cols: 9, mines: 10 },
  medium: { rows: 12, cols: 12, mines: 24 },
  // 40/196 ≈ 20.4% density — matches classic "expert" (~20.6%), challenging but solvable.
  hard: { rows: 14, cols: 14, mines: 40 },
};

function emptyCell(): Cell {
  return { mine: false, revealed: false, flagged: false, adj: 0 };
}

export function newGame(d: Difficulty): MineState {
  const grid = Array.from({ length: d.rows }, () =>
    Array.from({ length: d.cols }, emptyCell),
  );
  return {
    rows: d.rows,
    cols: d.cols,
    mines: d.mines,
    grid,
    placed: false,
    dead: false,
    won: false,
    flagsLeft: d.mines,
  };
}

function clone(state: MineState): MineState {
  return { ...state, grid: state.grid.map((row) => row.map((c) => ({ ...c }))) };
}

function neighbors(state: MineState, r: number, c: number): Array<[number, number]> {
  const out: Array<[number, number]> = [];
  for (let dr = -1; dr <= 1; dr++)
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = r + dr,
        nc = c + dc;
      if (nr >= 0 && nr < state.rows && nc >= 0 && nc < state.cols) out.push([nr, nc]);
    }
  return out;
}

// Place mines avoiding the safe cell and its neighbors, then compute adj counts.
export function placeMines(
  state: MineState,
  safeR: number,
  safeC: number,
  rng: () => number = Math.random,
): MineState {
  const s = clone(state);
  const banned = new Set<string>([`${safeR},${safeC}`]);
  neighbors(s, safeR, safeC).forEach(([r, c]) => banned.add(`${r},${c}`));

  const candidates: Array<[number, number]> = [];
  for (let r = 0; r < s.rows; r++)
    for (let c = 0; c < s.cols; c++) if (!banned.has(`${r},${c}`)) candidates.push([r, c]);

  // Fisher-Yates partial shuffle, take the first `mines`.
  const count = Math.min(s.mines, candidates.length);
  for (let i = 0; i < count; i++) {
    const j = i + Math.floor(rng() * (candidates.length - i));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
    const [r, c] = candidates[i];
    s.grid[r][c].mine = true;
  }
  for (let r = 0; r < s.rows; r++)
    for (let c = 0; c < s.cols; c++)
      s.grid[r][c].adj = neighbors(s, r, c).filter(([nr, nc]) => s.grid[nr][nc].mine).length;
  s.placed = true;
  return s;
}

function checkWin(s: MineState): boolean {
  for (let r = 0; r < s.rows; r++)
    for (let c = 0; c < s.cols; c++) {
      const cell = s.grid[r][c];
      if (!cell.mine && !cell.revealed) return false;
    }
  return true;
}

// Reveal a cell; flood-fills through zero-adjacent cells. First reveal places mines.
export function reveal(state: MineState, r: number, c: number, rng: () => number = Math.random): MineState {
  if (state.dead || state.won) return state;
  let s = state.placed ? clone(state) : placeMines(state, r, c, rng);
  const start = s.grid[r][c];
  if (start.revealed || start.flagged) return s;

  if (start.mine) {
    start.revealed = true;
    s.dead = true;
    // reveal all mines
    for (let rr = 0; rr < s.rows; rr++)
      for (let cc = 0; cc < s.cols; cc++) if (s.grid[rr][cc].mine) s.grid[rr][cc].revealed = true;
    return s;
  }

  // BFS flood fill.
  const stack: Array<[number, number]> = [[r, c]];
  while (stack.length) {
    const [cr, cc] = stack.pop()!;
    const cell = s.grid[cr][cc];
    if (cell.revealed || cell.flagged || cell.mine) continue;
    cell.revealed = true;
    if (cell.adj === 0) {
      for (const [nr, nc] of neighbors(s, cr, cc)) {
        if (!s.grid[nr][nc].revealed) stack.push([nr, nc]);
      }
    }
  }
  s.won = checkWin(s);
  return s;
}

export function toggleFlag(state: MineState, r: number, c: number): MineState {
  if (state.dead || state.won) return state;
  const cell = state.grid[r][c];
  if (cell.revealed) return state;
  const s = clone(state);
  const t = s.grid[r][c];
  t.flagged = !t.flagged;
  s.flagsLeft += t.flagged ? -1 : 1;
  return s;
}
