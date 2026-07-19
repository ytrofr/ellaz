// Find-the-difference — pure hit-testing. The two pictures share a base scene;
// each "difference" is a point with a tap radius. Tapping near an unfound
// difference (on either picture) marks it found. No DOM here.
export interface Diff {
  id: string;
  cx: number;
  cy: number;
  r: number; // tap radius in scene units
}

export interface FindState {
  diffs: Diff[];
  found: string[];
  misses: number;
}

export function newGame(diffs: Diff[]): FindState {
  return { diffs, found: [], misses: 0 };
}

export type TapResult =
  | { kind: "hit"; id: string }
  | { kind: "already" }
  | { kind: "miss" };

// Test a tap at scene coordinates (x,y). Returns the new state + outcome.
export function tapAt(state: FindState, x: number, y: number): { state: FindState; result: TapResult } {
  let best: { id: string; d: number } | null = null;
  for (const d of state.diffs) {
    const dist = Math.hypot(x - d.cx, y - d.cy);
    if (dist <= d.r && (best === null || dist < best.d)) best = { id: d.id, d: dist };
  }
  if (!best) {
    return { state: { ...state, misses: state.misses + 1 }, result: { kind: "miss" } };
  }
  if (state.found.includes(best.id)) {
    return { state, result: { kind: "already" } };
  }
  return {
    state: { ...state, found: [...state.found, best.id] },
    result: { kind: "hit", id: best.id },
  };
}

export function isWon(state: FindState): boolean {
  return state.found.length === state.diffs.length;
}

export function remaining(state: FindState): number {
  return state.diffs.length - state.found.length;
}
