// Tic-Tac-Toe — pure logic + an unbeatable minimax AI. No DOM.
export type Cell = "X" | "O" | null;
export type Board = Cell[]; // length 9, index 0..8 row-major
export type Player = "X" | "O";

export const LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

export function emptyBoard(): Board {
  return Array<Cell>(9).fill(null);
}

export function winner(b: Board): { player: Player; line: number[] } | null {
  for (const line of LINES) {
    const [a, c, d] = line;
    if (b[a] && b[a] === b[c] && b[a] === b[d]) {
      return { player: b[a] as Player, line };
    }
  }
  return null;
}

export function isFull(b: Board): boolean {
  return b.every((c) => c !== null);
}

export function isDraw(b: Board): boolean {
  return isFull(b) && !winner(b);
}

export function available(b: Board): number[] {
  const out: number[] = [];
  b.forEach((c, i) => c === null && out.push(i));
  return out;
}

export function place(b: Board, index: number, player: Player): Board {
  if (b[index] !== null) return b;
  const next = b.slice();
  next[index] = player;
  return next;
}

// Minimax: returns the score for `toMove` from the perspective of `ai`.
function minimax(b: Board, toMove: Player, ai: Player, depth: number): number {
  const w = winner(b);
  if (w) return w.player === ai ? 10 - depth : depth - 10;
  if (isFull(b)) return 0;

  const human: Player = ai === "X" ? "O" : "X";
  const maximizing = toMove === ai;
  let best = maximizing ? -Infinity : Infinity;
  for (const move of available(b)) {
    const score = minimax(place(b, move, toMove), toMove === "X" ? "O" : "X", ai, depth + 1);
    best = maximizing ? Math.max(best, score) : Math.min(best, score);
  }
  void human;
  return best;
}

// The AI's optimal move. `rng` only breaks ties among equally-optimal moves so
// the unbeatable AI still feels varied.
export function bestMove(b: Board, ai: Player, rng: () => number = Math.random): number {
  const moves = available(b);
  let bestScore = -Infinity;
  let bestMoves: number[] = [];
  for (const move of moves) {
    const score = minimax(place(b, move, ai), ai === "X" ? "O" : "X", ai, 0);
    if (score > bestScore) {
      bestScore = score;
      bestMoves = [move];
    } else if (score === bestScore) {
      bestMoves.push(move);
    }
  }
  return bestMoves[Math.floor(rng() * bestMoves.length)];
}

export type Difficulty = "easy" | "medium" | "hard";

// A random available cell — the "easy" AI.
export function randomMove(b: Board, rng: () => number = Math.random): number {
  const moves = available(b);
  return moves[Math.floor(rng() * moves.length)];
}

// Difficulty-aware move selection. Keeps the minimax internals via bestMove():
//  - easy:   always a random available cell
//  - medium: minimax-best ~50% of the time, otherwise random (rng decides)
//  - hard:   always minimax-best (unbeatable)
export function chooseMove(
  b: Board,
  ai: Player,
  level: Difficulty,
  rng: () => number = Math.random,
): number {
  if (level === "easy") return randomMove(b, rng);
  if (level === "hard") return bestMove(b, ai, rng);
  // medium: flip a coin from rng to pick optimal vs random.
  return rng() < 0.5 ? bestMove(b, ai, rng) : randomMove(b, rng);
}
