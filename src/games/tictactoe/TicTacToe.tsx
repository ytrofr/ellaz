import { useCallback, useEffect, useRef, useState } from "react";
import type { GameContext } from "@sdk/index";
import { Button, Stat } from "@ui/components";
import { burst, shake, haptic, celebrate } from "@juice/index";
import { emptyBoard, winner, isDraw, place, bestMove, type Board } from "./logic";

// Human is X (goes first), AI is O (unbeatable minimax). Tap a cell to play.
export function TicTacToe({ ctx }: { ctx: GameContext }) {
  const [board, setBoard] = useState<Board>(() => emptyBoard());
  const [busy, setBusy] = useState(false);
  const boardRef = useRef<HTMLDivElement>(null);
  const started = useRef(false);
  const win = winner(board);
  const draw = isDraw(board);
  const done = !!win || draw;

  useEffect(() => {
    if (!started.current) {
      started.current = true;
      ctx.lifecycle.gameplayStart();
      ctx.analytics.levelStart("vs-ai");
    }
  }, [ctx]);

  const reset = useCallback(() => {
    setBoard(emptyBoard());
    setBusy(false);
    ctx.analytics.levelStart("vs-ai");
  }, [ctx]);

  const finish = useCallback(
    (b: Board) => {
      const w = winner(b);
      if (w) {
        if (w.player === "X") {
          ctx.audio.play("win");
          haptic.win();
          celebrate();
          if (boardRef.current) {
            const r = boardRef.current.getBoundingClientRect();
            burst(r.left + r.width / 2, r.top + r.height / 2, { count: 14 });
          }
          ctx.analytics.levelComplete("vs-ai", 0);
        } else {
          ctx.audio.play("fail");
          if (boardRef.current) shake(boardRef.current);
          ctx.analytics.levelFail("vs-ai", "ai-won");
        }
      } else if (isDraw(b)) {
        ctx.audio.play("pop");
      }
    },
    [ctx],
  );

  const onCell = useCallback(
    (i: number) => {
      if (done || busy || board[i] !== null) return;
      ctx.audio.unlock();
      ctx.audio.play("tap");
      haptic.tap();
      const afterHuman = place(board, i, "X");
      setBoard(afterHuman);
      if (winner(afterHuman) || isDraw(afterHuman)) {
        finish(afterHuman);
        return;
      }
      // AI replies after a short beat so the move is legible.
      setBusy(true);
      setTimeout(() => {
        const aiMove = bestMove(afterHuman, "O");
        const afterAi = place(afterHuman, aiMove, "O");
        setBoard(afterAi);
        setBusy(false);
        ctx.audio.play("flip");
        if (winner(afterAi) || isDraw(afterAi)) finish(afterAi);
      }, 380);
    },
    [board, busy, done, ctx, finish],
  );

  const status = win
    ? win.player === "X"
      ? ctx.t("youWon")
      : ctx.t("gameOver")
    : draw
      ? ctx.locale === "he"
        ? "תיקו"
        : "Draw"
      : ctx.locale === "he"
        ? "התור שלך"
        : "Your turn";

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18, padding: 16 }}>
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <Stat label={ctx.locale === "he" ? "מצב" : "Status"} value={status} />
        <Button variant="ghost" onClick={reset}>
          {ctx.t("restart")}
        </Button>
      </div>

      <div
        ref={boardRef}
        className="ellaz-play-surface"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          // explicit equal rows: without this, a cell holding a big X/O glyph grows
          // its row taller than the empty rows and the square board deforms
          gridTemplateRows: "repeat(3, 1fr)",
          gap: 10,
          width: "min(84vw, 62vh, 360px)",
          aspectRatio: "1",
        }}
      >
        {board.map((cell, i) => {
          const winning = win?.line.includes(i);
          return (
            <button
              key={i}
              className={winning ? "ellaz-pulse" : undefined}
              aria-label={cell ?? `cell ${i + 1}`}
              onClick={() => onCell(i)}
              style={{
                border: "none",
                borderRadius: 16,
                background: winning ? "linear-gradient(180deg,#55efc4,#00cec9)" : "var(--surface)",
                color: cell === "X" ? "var(--brand-2)" : "var(--teal)",
                fontSize: "clamp(36px, 12vw, 72px)",
                fontWeight: 800,
                lineHeight: 1,
                // grid items must be allowed to shrink below content size so the
                // glyph never forces the cell to grow
                minWidth: 0,
                minHeight: 0,
                overflow: "hidden",
                display: "grid",
                placeItems: "center",
                boxShadow: "var(--shadow-1)",
              }}
            >
              {cell}
            </button>
          );
        })}
      </div>

      {done && (
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 40 }}>{win?.player === "X" ? "🎉" : win ? "🤖" : "🤝"}</div>
          <Button onClick={reset}>{ctx.t("restart")}</Button>
        </div>
      )}
    </div>
  );
}
