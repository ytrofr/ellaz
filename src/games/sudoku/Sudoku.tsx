import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { GameContext } from "@sdk/index";
import { Button } from "@ui/components";
import { burst, haptic, celebrate } from "@juice/index";
import { generate, setCell, conflicts, isSolved, type SudokuState, type Level } from "./logic";

export function Sudoku({ ctx }: { ctx: GameContext }) {
  const [level, setLevel] = useState<Level>("easy");
  const [state, setState] = useState<SudokuState>(() => generate("easy"));
  const [sel, setSel] = useState<[number, number] | null>(null);
  const [won, setWon] = useState(false);
  const boardRef = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    if (!started.current) {
      started.current = true;
      ctx.lifecycle.gameplayStart();
      ctx.analytics.levelStart("easy");
    }
  }, [ctx]);

  const bad = useMemo(() => conflicts(state), [state]);

  const reset = useCallback(
    (lv: Level = level) => {
      setLevel(lv);
      setState(generate(lv));
      setSel(null);
      setWon(false);
      ctx.analytics.levelStart(lv);
    },
    [ctx, level],
  );

  const enter = useCallback(
    (v: number) => {
      if (won || !sel) return;
      const [r, c] = sel;
      if (state.given[r][c]) return;
      ctx.audio.unlock();
      const ns = setCell(state, r, c, v);
      setState(ns);
      ctx.audio.play(v === 0 ? "tap" : "pop");
      if (isSolved(ns)) {
        setWon(true);
        ctx.audio.play("win");
        haptic.win();
        celebrate();
        if (boardRef.current) {
          const rect = boardRef.current.getBoundingClientRect();
          burst(rect.left + rect.width / 2, rect.top + rect.height / 2, { count: 16 });
        }
        ctx.analytics.levelComplete(level, 0);
      }
    },
    [ctx, sel, state, won, level],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key >= "1" && e.key <= "9") enter(Number(e.key));
      else if (e.key === "Backspace" || e.key === "Delete" || e.key === "0") enter(0);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [enter]);

  const selVal = sel ? state.puzzle[sel[0]][sel[1]] : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, padding: 12 }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <Button variant={level === "easy" ? "primary" : "ghost"} onClick={() => reset("easy")}>
          {ctx.locale === "he" ? "קל" : "Easy"}
        </Button>
        <Button variant={level === "medium" ? "primary" : "ghost"} onClick={() => reset("medium")}>
          {ctx.locale === "he" ? "בינוני" : "Med"}
        </Button>
        <Button variant="ghost" onClick={() => reset()}>
          {ctx.t("restart")}
        </Button>
      </div>

      <div
        ref={boardRef}
        className="ellaz-play-surface"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(9, 1fr)",
          width: "min(94vw, 60vh, 440px)",
          aspectRatio: "1",
          background: "#20244a",
          border: "3px solid #6c5ce7",
          borderRadius: 8,
          touchAction: "none",
        }}
      >
        {state.puzzle.map((row, r) =>
          row.map((v, c) => {
            const selected = sel && sel[0] === r && sel[1] === c;
            const sameVal = selVal !== 0 && v === selVal;
            const conflict = bad.has(`${r},${c}`);
            return (
              <button
                key={`${r}-${c}`}
                aria-label={`cell ${r + 1},${c + 1}`}
                onClick={() => setSel([r, c])}
                style={{
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRight: c % 3 === 2 && c !== 8 ? "2px solid #6c5ce7" : undefined,
                  borderBottom: r % 3 === 2 && r !== 8 ? "2px solid #6c5ce7" : undefined,
                  background: selected
                    ? "#4a4f96"
                    : sameVal
                      ? "rgba(108,92,231,0.25)"
                      : "transparent",
                  color: conflict ? "#ff7675" : state.given[r][c] ? "#ffffff" : "#a29bfe",
                  fontWeight: state.given[r][c] ? 800 : 600,
                  fontSize: "clamp(14px, 4.4vw, 26px)",
                  padding: 0,
                  aspectRatio: "1",
                }}
              >
                {v || ""}
              </button>
            );
          }),
        )}
      </div>

      {/* Number pad (touch) */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8, width: "min(94vw, 440px)" }}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
          <button
            key={n}
            aria-label={`enter ${n}`}
            onClick={() => enter(n)}
            style={{
              minHeight: 48,
              border: "none",
              borderRadius: 10,
              background: "var(--surface-2)",
              color: "var(--text)",
              fontSize: 22,
              fontWeight: 800,
            }}
          >
            {n}
          </button>
        ))}
        <button
          aria-label="erase"
          onClick={() => enter(0)}
          style={{ minHeight: 48, border: "none", borderRadius: 10, background: "var(--surface-2)", color: "var(--text)", fontSize: 20 }}
        >
          ⌫
        </button>
      </div>

      <div style={{ color: "var(--text-dim)", fontSize: 13 }}>
        {won ? ctx.t("youWon") + " 🎉" : ctx.locale === "he" ? "בחרו תא והקישו מספר" : "Pick a cell, tap a number"}
      </div>
    </div>
  );
}
