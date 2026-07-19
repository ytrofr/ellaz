import { describe, it, expect } from "vitest";
import { newGame, step, turn, placeFood, type SnakeState } from "./logic";

describe("snake logic", () => {
  it("starts with a 3-segment snake moving right", () => {
    const s = newGame(17, 17, () => 0);
    expect(s.body.length).toBe(3);
    expect(s.dir).toBe("right");
    expect(s.alive).toBe(true);
  });

  it("moves the head forward and drops the tail", () => {
    const s = newGame(17, 17, () => 0);
    const head = s.body[0];
    const next = step(s, () => 0);
    expect(next.body[0]).toEqual({ x: head.x + 1, y: head.y });
    expect(next.body.length).toBe(3);
  });

  it("ignores a 180° reversal onto the neck", () => {
    const s = newGame(17, 17, () => 0);
    const turned = turn(s, "left"); // currently moving right
    expect(turned.pendingDir).toBe("right");
  });

  it("grows and scores when eating food", () => {
    let s = newGame(17, 17, () => 0);
    // Place food directly ahead of the head.
    const head = s.body[0];
    s = { ...s, food: { x: head.x + 1, y: head.y } };
    const next = step(s, () => 0);
    expect(next.score).toBe(1);
    expect(next.body.length).toBe(4); // grew by one
  });

  it("dies on wall collision", () => {
    // Build a snake one cell from the right wall, facing right.
    let s: SnakeState = newGame(5, 5, () => 0);
    s = { ...s, body: [{ x: 4, y: 2 }, { x: 3, y: 2 }, { x: 2, y: 2 }], dir: "right", pendingDir: "right" };
    const next = step(s, () => 0);
    expect(next.alive).toBe(false);
  });

  it("dies running into its own body (a non-tail segment)", () => {
    // Head at {2,2}; stepping down lands on {2,3}, a mid-body segment (the tail is
    // {3,3}, which does NOT vacate {2,3}), so this is a real self-collision.
    let s: SnakeState = newGame(6, 6, () => 0);
    s = {
      ...s,
      body: [
        { x: 2, y: 2 },
        { x: 1, y: 2 },
        { x: 1, y: 3 },
        { x: 2, y: 3 },
        { x: 3, y: 3 },
      ],
      dir: "right",
      pendingDir: "down",
    };
    const next = step(s, () => 0);
    expect(next.alive).toBe(false);
  });

  it("may legally step into the tail cell it is about to vacate", () => {
    // Head {2,2}, tail {2,3}; moving down onto the vacating tail is allowed.
    let s: SnakeState = newGame(6, 6, () => 0);
    s = {
      ...s,
      body: [
        { x: 2, y: 2 },
        { x: 3, y: 2 },
        { x: 3, y: 3 },
        { x: 2, y: 3 },
      ],
      dir: "right",
      pendingDir: "down",
      food: { x: 0, y: 0 },
    };
    const next = step(s, () => 0);
    expect(next.alive).toBe(true);
  });

  it("places food on a free cell, never on the body", () => {
    const s = newGame(4, 4, () => 0.999);
    const food = placeFood(s, () => 0.999);
    const onBody = s.body.some((p) => p.x === food.x && p.y === food.y);
    expect(onBody).toBe(false);
  });
});
