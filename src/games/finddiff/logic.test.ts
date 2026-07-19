import { describe, it, expect } from "vitest";
import { newGame, tapAt, isWon, remaining, type Diff } from "./logic";
import { SCENES, diffsOf } from "./scenes";

const DIFFS: Diff[] = [
  { id: "a", cx: 20, cy: 20, r: 12 },
  { id: "b", cx: 80, cy: 40, r: 12 },
  { id: "c", cx: 50, cy: 90, r: 12 },
];

describe("find-the-difference logic", () => {
  it("registers a hit within radius", () => {
    let s = newGame(DIFFS);
    const { state, result } = tapAt(s, 22, 18);
    expect(result).toEqual({ kind: "hit", id: "a" });
    expect(state.found).toEqual(["a"]);
  });

  it("counts a miss when tapping empty space", () => {
    const s = newGame(DIFFS);
    const { state, result } = tapAt(s, 5, 5);
    expect(result.kind).toBe("miss");
    expect(state.misses).toBe(1);
  });

  it("ignores a re-tap on an already-found difference", () => {
    let s = newGame(DIFFS);
    s = tapAt(s, 20, 20).state;
    const { result } = tapAt(s, 20, 20);
    expect(result.kind).toBe("already");
  });

  it("picks the nearest difference when two are close", () => {
    const diffs: Diff[] = [
      { id: "near", cx: 50, cy: 50, r: 20 },
      { id: "far", cx: 60, cy: 50, r: 20 },
    ];
    const { result } = tapAt(newGame(diffs), 52, 50);
    expect(result).toEqual({ kind: "hit", id: "near" });
  });

  it("wins when all differences are found", () => {
    let s = newGame(DIFFS);
    expect(remaining(s)).toBe(3);
    s = tapAt(s, 20, 20).state;
    s = tapAt(s, 80, 40).state;
    expect(isWon(s)).toBe(false);
    s = tapAt(s, 50, 90).state;
    expect(isWon(s)).toBe(true);
    expect(remaining(s)).toBe(0);
  });
});

describe("scene data", () => {
  it("ships at least 4 scenes", () => {
    expect(SCENES.length).toBeGreaterThanOrEqual(4);
  });

  it("every scene has exactly 5 differences with in-range coords and sane radii", () => {
    for (const scene of SCENES) {
      expect(scene.diffs.length, `${scene.id} diff count`).toBe(5);
      for (const d of scene.diffs) {
        expect(d.cx, `${scene.id}/${d.id} cx`).toBeGreaterThanOrEqual(0);
        expect(d.cx, `${scene.id}/${d.id} cx`).toBeLessThanOrEqual(100);
        expect(d.cy, `${scene.id}/${d.id} cy`).toBeGreaterThanOrEqual(0);
        expect(d.cy, `${scene.id}/${d.id} cy`).toBeLessThanOrEqual(100);
        expect(d.r, `${scene.id}/${d.id} r`).toBeGreaterThanOrEqual(6);
        expect(d.r, `${scene.id}/${d.id} r`).toBeLessThanOrEqual(14);
      }
    }
  });

  it("each scene's diff ids are unique (marker lookup is by id)", () => {
    for (const scene of SCENES) {
      const ids = scene.diffs.map((d) => d.id);
      expect(new Set(ids).size, `${scene.id} unique ids`).toBe(ids.length);
    }
  });

  it("diffsOf projects to plain logic Diffs and wins when all are tapped", () => {
    for (const scene of SCENES) {
      let s = newGame(diffsOf(scene));
      expect(remaining(s)).toBe(5);
      for (const d of scene.diffs) s = tapAt(s, d.cx, d.cy).state;
      expect(isWon(s), `${scene.id} winnable`).toBe(true);
    }
  });
});
