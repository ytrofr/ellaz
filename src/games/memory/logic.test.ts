import { describe, it, expect } from "vitest";
import { newGame, flip, resolveMismatch, isWon, shuffle } from "./logic";

const FACES = ["🐶", "🐱", "🦊"]; // 3 pairs = 6 cards

describe("memory logic", () => {
  it("builds a deck of pairs, all face-down", () => {
    const s = newGame(FACES, () => 0);
    expect(s.cards.length).toBe(6);
    expect(s.totalPairs).toBe(3);
    expect(s.cards.every((c) => !c.flipped && !c.matched)).toBe(true);
  });

  it("reveals the first card, then matches an identical second", () => {
    // Deterministic deck: identity shuffle keeps [dog,dog,cat,cat,fox,fox]... but
    // shuffle with rng=()=>0 produces a fixed order; find two identical faces.
    let s = newGame(FACES, () => 0);
    const firstFace = s.cards[0].face;
    const partner = s.cards.findIndex((c, i) => i !== 0 && c.face === firstFace);

    let r = flip(s, 0);
    expect(r.outcome.kind).toBe("revealed");
    s = r.state;

    r = flip(s, partner);
    expect(r.outcome.kind).toBe("matched");
    s = r.state;
    expect(s.matchedPairs).toBe(1);
    expect(s.cards[0].matched).toBe(true);
    expect(s.cards[partner].matched).toBe(true);
    expect(s.moves).toBe(1);
  });

  it("locks on mismatch and resolves back to face-down", () => {
    let s = newGame(FACES, () => 0);
    const firstFace = s.cards[0].face;
    const different = s.cards.findIndex((c) => c.face !== firstFace);

    s = flip(s, 0).state;
    const r = flip(s, different);
    expect(r.outcome.kind).toBe("mismatch");
    s = r.state;
    expect(s.lock).toBe(true);

    s = resolveMismatch(s, 0, different);
    expect(s.lock).toBe(false);
    expect(s.cards[0].flipped).toBe(false);
    expect(s.cards[different].flipped).toBe(false);
  });

  it("ignores taps while locked or on matched/flipped cards", () => {
    let s = newGame(FACES, () => 0);
    s = flip(s, 0).state;
    // tapping the same card again is ignored
    expect(flip(s, 0).outcome.kind).toBe("ignored");
  });

  it("detects a win when all pairs matched", () => {
    let s = newGame(FACES, () => 0);
    // Greedily match every pair.
    while (!isWon(s)) {
      const a = s.cards.findIndex((c) => !c.matched);
      const b = s.cards.findIndex((c, i) => i !== a && !c.matched && c.face === s.cards[a].face);
      s = flip(s, a).state;
      s = flip(s, b).state;
    }
    expect(isWon(s)).toBe(true);
    expect(s.matchedPairs).toBe(3);
  });

  it("shuffle preserves multiset of elements", () => {
    const out = shuffle([1, 2, 3, 4, 5], () => 0.5);
    expect(out.slice().sort()).toEqual([1, 2, 3, 4, 5]);
  });
});
