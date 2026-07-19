import { useCallback, useEffect, useRef, useState } from "react";
import type { GameContext } from "@sdk/index";
import { Button, Stat } from "@ui/components";
import { burst, haptic } from "@juice/index";
import { newGame, flip, resolveMismatch, isWon, type MemoryState } from "./logic";

// Big, colorful animal faces — icon-first, no reading required (age 5).
const FACE_SETS = [
  ["🐶", "🐱", "🦊", "🐰", "🐻", "🐼"],
  ["🍎", "🍌", "🍓", "🍇", "🍊", "🍉"],
  ["🚗", "🚀", "⛵", "🚁", "🚜", "🚲"],
];

export function Memory({ ctx }: { ctx: GameContext }) {
  const [setIdx, setSetIdx] = useState(0);
  const [state, setState] = useState<MemoryState>(() => newGame(FACE_SETS[0]));
  const [won, setWon] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    if (!started.current) {
      started.current = true;
      ctx.lifecycle.gameplayStart();
      ctx.analytics.levelStart("set-1");
    }
  }, [ctx]);

  const reset = useCallback(
    (nextSet?: number) => {
      const si = nextSet ?? setIdx;
      setSetIdx(si);
      setState(newGame(FACE_SETS[si]));
      setWon(false);
      ctx.analytics.levelStart(`set-${si + 1}`);
    },
    [ctx, setIdx],
  );

  const onCard = useCallback(
    (index: number) => {
      ctx.audio.unlock();
      const { state: ns, outcome } = flip(state, index);
      if (outcome.kind === "ignored") return;
      setState(ns);
      if (outcome.kind === "revealed") {
        ctx.audio.play("flip");
        haptic.tap();
      } else if (outcome.kind === "matched") {
        ctx.audio.play("success");
        haptic.success();
        const el = gridRef.current;
        if (el) {
          const r = el.getBoundingClientRect();
          burst(r.left + r.width / 2, r.top + r.height / 2, { count: 10 });
        }
        if (isWon(ns)) {
          setWon(true);
          ctx.audio.play("win");
          haptic.win();
          ctx.analytics.levelComplete(`set-${setIdx + 1}`, ns.moves);
        }
      } else if (outcome.kind === "mismatch") {
        const { a, b } = outcome;
        setTimeout(() => setState((s) => resolveMismatch(s, a, b)), 850);
      }
    },
    [ctx, state, setIdx],
  );

  const cols = 4;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: 16 }}>
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <Stat label={ctx.t("pairs")} value={`${state.matchedPairs}/${state.totalPairs}`} />
        <Stat label={ctx.t("moves")} value={state.moves} />
        <Button variant="ghost" kids onClick={() => reset()}>
          🔄
        </Button>
        <Button variant="ghost" kids ariaLabel="next set" onClick={() => reset((setIdx + 1) % FACE_SETS.length)}>
          🎨
        </Button>
      </div>

      <div
        ref={gridRef}
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gap: 12,
          // cap by height too so the 3-row grid fits landscape without scrolling
          width: "min(92vw, 72vh, 460px)",
        }}
      >
        {state.cards.map((card, i) => {
          const faceUp = card.flipped || card.matched;
          return (
            <button
              key={card.id}
              aria-label={faceUp ? card.face : "card"}
              onClick={() => onCard(i)}
              style={{
                aspectRatio: "1",
                minHeight: 64,
                border: "none",
                borderRadius: 16,
                fontSize: "clamp(30px, 9vw, 52px)",
                display: "grid",
                placeItems: "center",
                background: faceUp
                  ? card.matched
                    ? "linear-gradient(180deg,#55efc4,#00cec9)"
                    : "#fff"
                  : "linear-gradient(180deg,var(--brand-2),var(--brand))",
                color: "#222",
                boxShadow: "var(--shadow-1)",
                transform: faceUp ? "rotateY(0deg)" : "rotateY(0deg)",
                transition: "background 0.15s ease, transform 0.15s ease",
                opacity: card.matched ? 0.92 : 1,
              }}
            >
              {faceUp ? card.face : "❓"}
            </button>
          );
        })}
      </div>

      {won && (
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 44 }}>🎉</div>
          <h2>{ctx.t("youWon")}</h2>
          <Button kids onClick={() => reset((setIdx + 1) % FACE_SETS.length)}>
            ▶
          </Button>
        </div>
      )}
    </div>
  );
}
