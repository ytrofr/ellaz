import { describe, it, expect } from "vitest";
import {
  emptyBoard,
  winner,
  isDraw,
  place,
  bestMove,
  chooseMove,
  available,
  type Board,
} from "./logic";

describe("tic-tac-toe logic", () => {
  it("detects a row/col/diagonal win", () => {
    const row: Board = ["X", "X", "X", null, null, null, null, null, null];
    expect(winner(row)?.player).toBe("X");
    const col: Board = ["O", null, null, "O", null, null, "O", null, null];
    expect(winner(col)?.player).toBe("O");
    const diag: Board = ["X", null, null, null, "X", null, null, null, "X"];
    expect(winner(diag)?.player).toBe("X");
  });

  it("reports a draw on a full board with no winner", () => {
    const b: Board = ["X", "O", "X", "X", "O", "O", "O", "X", "X"];
    expect(winner(b)).toBeNull();
    expect(isDraw(b)).toBe(true);
  });

  it("place() is immutable and rejects occupied cells", () => {
    const b = emptyBoard();
    const b2 = place(b, 0, "X");
    expect(b[0]).toBeNull(); // original untouched
    expect(b2[0]).toBe("X");
    expect(place(b2, 0, "O")[0]).toBe("X"); // occupied → unchanged
  });

  it("AI takes an immediate winning move", () => {
    // O can win at index 2.
    const b: Board = ["O", "O", null, "X", "X", null, null, null, null];
    expect(bestMove(b, "O", () => 0)).toBe(2);
  });

  it("AI blocks the opponent's immediate win", () => {
    // X threatens 6 (0,3,_). O must block at 6.
    const b: Board = ["X", null, null, "X", "O", null, null, null, null];
    expect(bestMove(b, "O", () => 0)).toBe(6);
  });

  it("AI is unbeatable at hard: optimal play from empty never loses", () => {
    // Simulate human playing greedily (first available) vs the minimax AI.
    let b = emptyBoard();
    let turn: "X" | "O" = "X"; // human = X moves first
    const ai: "X" | "O" = "O";
    while (!winner(b) && available(b).length > 0) {
      if (turn === ai) {
        b = place(b, chooseMove(b, ai, "hard", () => 0), ai);
      } else {
        b = place(b, available(b)[0], "X");
      }
      turn = turn === "X" ? "O" : "X";
    }
    const w = winner(b);
    expect(w?.player === "X").toBe(false); // human must never win
  });

  it("easy returns a valid available cell", () => {
    const b: Board = ["X", null, "O", null, "X", null, null, null, "O"];
    const avail = available(b);
    // Sweep the rng across its full range — every pick must be an open cell.
    for (const r of [0, 0.25, 0.5, 0.75, 0.99]) {
      const move = chooseMove(b, "O", "easy", () => r);
      expect(avail).toContain(move);
    }
  });

  it("medium returns a valid available cell for both coin-flip branches", () => {
    const b: Board = ["X", null, "O", null, "X", null, null, null, "O"];
    const avail = available(b);
    // rng<0.5 → minimax branch, rng>=0.5 → random branch. Both must be legal.
    expect(avail).toContain(chooseMove(b, "O", "medium", () => 0.2)); // optimal branch
    expect(avail).toContain(chooseMove(b, "O", "medium", () => 0.8)); // random branch
  });

  it("medium takes the winning move when the coin flip picks minimax", () => {
    // O can win at index 2; rng<0.5 forces the minimax branch, then tie-break at 0.
    const b: Board = ["O", "O", null, "X", "X", null, null, null, null];
    expect(chooseMove(b, "O", "medium", () => 0)).toBe(2);
  });
});
