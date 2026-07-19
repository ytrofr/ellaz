import { useCallback, useRef, useState, useEffect, type PointerEvent as ReactPointerEvent } from "react";
import type { GameContext } from "@sdk/index";
import { Button } from "@ui/components";
import { burst, shake, haptic } from "@juice/index";
import { newGame, tapObject, isWon, targetIcons, type HiddenState } from "./logic";

// A big cast of original characters; find the ones on the target strip.
const CAST = [
  "🐶", "🐱", "🦊", "🐰", "🐻", "🐼", "🐨", "🐵", "🦁", "🐯", "🐸", "🐷",
  "🐔", "🐧", "🐦", "🦉", "🦄", "🐝", "🦋", "🐢", "🐙", "🦖", "🦕", "🐳",
];
const NUM_TARGETS = 3;

export function Hidden({ ctx }: { ctx: GameContext }) {
  const [state, setState] = useState<HiddenState>(() => newGame(CAST, NUM_TARGETS));
  const [won, setWon] = useState(false);
  const sceneRef = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    if (!started.current) {
      started.current = true;
      ctx.lifecycle.gameplayStart();
      ctx.analytics.levelStart("crowd");
    }
  }, [ctx]);

  const reset = useCallback(() => {
    setState(newGame(CAST, NUM_TARGETS));
    setWon(false);
    ctx.analytics.levelStart("crowd");
  }, [ctx]);

  const onObject = useCallback(
    (id: string, e: ReactPointerEvent) => {
      ctx.audio.unlock();
      const { state: ns, result } = tapObject(state, id);
      if (result.kind === "found") {
        setState(ns);
        ctx.audio.play("success");
        haptic.success();
        burst(e.clientX, e.clientY, { count: 10 });
        if (isWon(ns)) {
          setWon(true);
          ctx.audio.play("win");
          haptic.win();
          ctx.analytics.levelComplete("crowd", 0);
        }
      } else if (result.kind === "not-target") {
        ctx.audio.play("tap");
        if (sceneRef.current) shake(sceneRef.current, 3, 130);
      }
    },
    [ctx, state],
  );

  const targets = targetIcons(state);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: 12 }}>
      {/* Target strip: the characters to find */}
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <span style={{ color: "var(--text-dim)", fontSize: 14 }}>
          {ctx.locale === "he" ? "מצאו:" : "Find:"}
        </span>
        {targets.map((t) => (
          <div
            key={t.id}
            style={{
              width: 52,
              height: 52,
              display: "grid",
              placeItems: "center",
              fontSize: 30,
              borderRadius: 12,
              background: t.found ? "linear-gradient(180deg,#55efc4,#00cec9)" : "var(--surface)",
              opacity: t.found ? 0.6 : 1,
              boxShadow: "var(--shadow-1)",
              position: "relative",
            }}
          >
            {t.icon}
            {t.found && (
              <span style={{ position: "absolute", right: 2, top: 0, fontSize: 16 }}>✅</span>
            )}
          </div>
        ))}
        <Button variant="ghost" kids ariaLabel="restart" onClick={reset}>
          🔄
        </Button>
      </div>

      {/* The crowd */}
      <div
        ref={sceneRef}
        className="ellaz-play-surface"
        style={{
          position: "relative",
          width: "min(94vw, 560px)",
          aspectRatio: "1 / 1.1",
          background: "radial-gradient(circle at 50% 30%, #2b3170, #1a1e3f)",
          borderRadius: 18,
          overflow: "hidden",
          boxShadow: "var(--shadow-2)",
          touchAction: "none",
        }}
      >
        {state.placed.map((o) => {
          const found = state.found.includes(o.id);
          return (
            <button
              key={o.id}
              aria-label="character"
              onPointerDown={(e) => onObject(o.id, e)}
              style={{
                position: "absolute",
                left: `${o.x}%`,
                top: `${o.y}%`,
                transform: "translate(-50%, -50%)",
                border: found ? "3px solid #00e0a4" : "none",
                background: "transparent",
                fontSize: "clamp(24px, 6vw, 34px)",
                lineHeight: 1,
                padding: 2,
                borderRadius: 10,
              }}
            >
              {o.icon}
            </button>
          );
        })}
      </div>

      {won ? (
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 40 }}>🎉</div>
          <Button kids onClick={reset}>
            ▶
          </Button>
        </div>
      ) : (
        <div style={{ color: "var(--text-dim)", fontSize: 13 }}>
          {ctx.locale === "he" ? "איפה הם מתחבאים? 👀" : "Where are they hiding? 👀"}
        </div>
      )}
    </div>
  );
}
