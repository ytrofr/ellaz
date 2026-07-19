import { describe, it, expect } from "vitest";
import { newGame, tapObject, isWon, targetIcons } from "./logic";

const ICONS = ["🐶", "🐱", "🦊", "🐰", "🐻", "🐼", "🐨", "🐵"];

function seq(vals: number[]) {
  let i = 0;
  return () => vals[i++ % vals.length];
}

describe("hidden-object logic", () => {
  it("places every icon and picks the requested number of targets", () => {
    const s = newGame(ICONS, 3, seq([0.5]));
    expect(s.placed.length).toBe(ICONS.length);
    expect(s.targets.length).toBe(3);
    // positions within bounds
    for (const p of s.placed) {
      expect(p.x).toBeGreaterThanOrEqual(6);
      expect(p.x).toBeLessThanOrEqual(94);
      expect(p.y).toBeGreaterThanOrEqual(12);
      expect(p.y).toBeLessThanOrEqual(92);
    }
  });

  it("marks a target found, ignores non-targets and repeats", () => {
    const s = newGame(ICONS, 2, seq([0.3, 0.7]));
    const targetId = s.targets[0];
    const nonTarget = s.placed.find((p) => !s.targets.includes(p.id))!.id;

    expect(tapObject(s, nonTarget).result.kind).toBe("not-target");

    const r1 = tapObject(s, targetId);
    expect(r1.result).toEqual({ kind: "found", id: targetId });
    expect(r1.state.found).toContain(targetId);

    expect(tapObject(r1.state, targetId).result.kind).toBe("already");
  });

  it("wins when all targets are found", () => {
    let s = newGame(ICONS, 3, seq([0.2, 0.8, 0.4, 0.6]));
    for (const id of [...s.targets]) s = tapObject(s, id).state;
    expect(isWon(s)).toBe(true);
    expect(targetIcons(s).every((t) => t.found)).toBe(true);
  });
});
