// Snake — pure grid logic. The Phaser scene only draws the state this produces.
// Deterministic given a RNG for food placement.

export interface Point {
  x: number;
  y: number;
}
export type Dir = "up" | "down" | "left" | "right";

export interface SnakeState {
  cols: number;
  rows: number;
  body: Point[]; // head is body[0]
  dir: Dir;
  pendingDir: Dir; // buffered input, applied on the next step
  food: Point;
  alive: boolean;
  score: number;
  grow: number; // remaining segments to add
}

const DELTAS: Record<Dir, Point> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

const OPPOSITE: Record<Dir, Dir> = { up: "down", down: "up", left: "right", right: "left" };

export function newGame(cols = 17, rows = 17, rng: () => number = Math.random): SnakeState {
  const cx = Math.floor(cols / 2);
  const cy = Math.floor(rows / 2);
  const body: Point[] = [
    { x: cx, y: cy },
    { x: cx - 1, y: cy },
    { x: cx - 2, y: cy },
  ];
  const state: SnakeState = {
    cols,
    rows,
    body,
    dir: "right",
    pendingDir: "right",
    food: { x: 0, y: 0 },
    alive: true,
    score: 0,
    grow: 0,
  };
  state.food = placeFood(state, rng);
  return state;
}

export function placeFood(state: SnakeState, rng: () => number = Math.random): Point {
  const occupied = new Set(state.body.map((p) => `${p.x},${p.y}`));
  const free: Point[] = [];
  for (let y = 0; y < state.rows; y++)
    for (let x = 0; x < state.cols; x++) if (!occupied.has(`${x},${y}`)) free.push({ x, y });
  if (free.length === 0) return state.food;
  return free[Math.floor(rng() * free.length)];
}

// Queue a direction change. Ignored if it reverses directly onto the neck.
export function turn(state: SnakeState, dir: Dir): SnakeState {
  if (dir === OPPOSITE[state.dir]) return state;
  return { ...state, pendingDir: dir };
}

// Advance one tick. Returns the next state; on death alive=false and body frozen.
export function step(state: SnakeState, rng: () => number = Math.random): SnakeState {
  if (!state.alive) return state;
  const dir = state.pendingDir;
  const d = DELTAS[dir];
  const head = state.body[0];
  const next: Point = { x: head.x + d.x, y: head.y + d.y };

  // Wall collision.
  if (next.x < 0 || next.y < 0 || next.x >= state.cols || next.y >= state.rows) {
    return { ...state, dir, alive: false };
  }
  // Self collision (excluding the tail cell that will move away, unless growing).
  const willGrow = state.grow > 0 || (next.x === state.food.x && next.y === state.food.y);
  const bodyToCheck = willGrow ? state.body : state.body.slice(0, -1);
  if (bodyToCheck.some((p) => p.x === next.x && p.y === next.y)) {
    return { ...state, dir, alive: false };
  }

  const ate = next.x === state.food.x && next.y === state.food.y;
  const body = [next, ...state.body];
  let grow = state.grow;
  if (ate) grow += 1;
  if (grow > 0) {
    grow -= 1; // consume one growth: keep the tail this tick
  } else {
    body.pop(); // normal move: drop the tail
  }

  const nextState: SnakeState = {
    ...state,
    dir,
    body,
    grow,
    score: state.score + (ate ? 1 : 0),
  };
  if (ate) nextState.food = placeFood(nextState, rng);
  return nextState;
}
