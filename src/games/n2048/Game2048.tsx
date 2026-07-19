import { useEffect, useRef, useState, useCallback } from "react";
import type { GameContext } from "@sdk/index";
import { Button, Stat } from "@ui/components";
import { burst, shake, haptic } from "@juice/index";
import {
  newGame,
  move,
  spawn,
  hasMoves,
  hasWon,
  SIZE,
  type Grid,
  type Direction,
} from "./logic";

const TILE_COLORS: Record<number, string> = {
  2: "#eee4da",
  4: "#ede0c8",
  8: "#f2b179",
  16: "#f59563",
  32: "#f67c5f",
  64: "#f65e3b",
  128: "#edcf72",
  256: "#edcc61",
  512: "#edc850",
  1024: "#edc53f",
  2048: "#edc22e",
};

function tileText(v: number): string {
  return v >= 8 ? "#f9f6f2" : "#5b5147";
}

export function Game2048({ ctx }: { ctx: GameContext }) {
  const [grid, setGrid] = useState<Grid>(() => newGame());
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(() => ctx.storage.get("best", 0));
  const [won, setWon] = useState(false);
  const [over, setOver] = useState(false);
  const boardRef = useRef<HTMLDivElement>(null);
  const startedRef = useRef(false);

  const reset = useCallback(() => {
    setGrid(newGame());
    setScore(0);
    setWon(false);
    setOver(false);
    ctx.analytics.levelStart("endless");
  }, [ctx]);

  useEffect(() => {
    if (!startedRef.current) {
      startedRef.current = true;
      ctx.lifecycle.gameplayStart();
      ctx.analytics.levelStart("endless");
    }
  }, [ctx]);

  const doMove = useCallback(
    (dir: Direction) => {
      if (over) return;
      setGrid((g) => {
        const res = move(g, dir);
        if (!res.moved) return g;
        ctx.audio.unlock();
        const next = spawn(res.grid);
        if (res.gained > 0) {
          ctx.audio.play("success");
          haptic.tap();
          setScore((s) => {
            const ns = s + res.gained;
            setBest((b) => {
              const nb = Math.max(b, ns);
              ctx.storage.set("best", nb);
              return nb;
            });
            return ns;
          });
          // Burst at the board center-ish for merge feedback.
          const el = boardRef.current;
          if (el) {
            const r = el.getBoundingClientRect();
            burst(r.left + r.width / 2, r.top + r.height / 2, { count: 8 });
          }
        }
        if (!won && hasWon(next)) {
          setWon(true);
          ctx.audio.play("win");
          haptic.win();
          ctx.analytics.levelComplete("reach-2048", 0);
        }
        if (!hasMoves(next)) {
          setOver(true);
          ctx.audio.play("fail");
          if (boardRef.current) shake(boardRef.current);
          ctx.analytics.levelFail("endless", "no-moves");
        }
        return next;
      });
    },
    [ctx, over, won],
  );

  // Keyboard (desktop).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const map: Record<string, Direction> = {
        ArrowUp: "up",
        ArrowDown: "down",
        ArrowLeft: "left",
        ArrowRight: "right",
        w: "up",
        s: "down",
        a: "left",
        d: "right",
      };
      const dir = map[e.key];
      if (dir) {
        e.preventDefault();
        doMove(dir);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [doMove]);

  // Swipe (touch) via Pointer Events on the board.
  useEffect(() => {
    const el = boardRef.current;
    if (!el) return;
    let sx = 0,
      sy = 0,
      tracking = false;
    const down = (e: PointerEvent) => {
      tracking = true;
      sx = e.clientX;
      sy = e.clientY;
      el.setPointerCapture(e.pointerId);
    };
    const up = (e: PointerEvent) => {
      if (!tracking) return;
      tracking = false;
      const dx = e.clientX - sx;
      const dy = e.clientY - sy;
      if (Math.abs(dx) < 24 && Math.abs(dy) < 24) return;
      if (Math.abs(dx) > Math.abs(dy)) doMove(dx > 0 ? "right" : "left");
      else doMove(dy > 0 ? "down" : "up");
    };
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointerup", up);
    return () => {
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointerup", up);
    };
  }, [doMove]);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: 16 }}>
      <div style={{ display: "flex", gap: 10 }}>
        <Stat label={ctx.t("score")} value={score} />
        <Stat label={ctx.t("best")} value={best} />
        <Button variant="ghost" onClick={reset}>
          {ctx.t("restart")}
        </Button>
      </div>

      <div
        ref={boardRef}
        className="ellaz-play-surface"
        style={{
          position: "relative",
          width: "min(88vw, 420px)",
          aspectRatio: "1",
          background: "#bbada0",
          borderRadius: 14,
          padding: 10,
          display: "grid",
          gridTemplateColumns: `repeat(${SIZE}, 1fr)`,
          gap: 10,
          touchAction: "none",
        }}
      >
        {grid.flat().map((v, i) => (
          <div
            key={i}
            style={{
              display: "grid",
              placeItems: "center",
              background: v === 0 ? "rgba(238,228,218,0.35)" : TILE_COLORS[v] ?? "#3c3a32",
              borderRadius: 8,
              color: tileText(v),
              fontWeight: 800,
              fontSize: v >= 1024 ? "clamp(18px,5vw,30px)" : "clamp(22px,7vw,40px)",
              transition: "background 0.12s ease",
            }}
          >
            {v > 0 ? v : ""}
          </div>
        ))}

        {(won || over) && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "grid",
              placeItems: "center",
              background: "rgba(20,22,44,0.72)",
              borderRadius: 14,
              gap: 16,
            }}
          >
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 40 }}>{won ? "🎉" : "😅"}</div>
              <h2 style={{ margin: "8px 0" }}>{won ? ctx.t("youWon") : ctx.t("gameOver")}</h2>
              <Button onClick={reset}>{ctx.t("restart")}</Button>
            </div>
          </div>
        )}
      </div>
      <div style={{ color: "var(--text-dim)", fontSize: 13 }}>
        {ctx.dir === "rtl" ? "החליקו או חצים" : "Swipe or arrow keys"}
      </div>
    </div>
  );
}
