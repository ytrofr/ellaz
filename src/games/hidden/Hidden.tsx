import { useCallback, useRef, useState, useEffect, type PointerEvent as ReactPointerEvent } from "react";
import type { GameContext } from "@sdk/index";
import { Button, Stat } from "@ui/components";
import { burst, shake, haptic, celebrate } from "@juice/index";
import { newGame, tapObject, isWon, targetIcons, type HiddenState } from "./logic";

// A big cast of original characters (>=34 distinct so "hard" has a full crowd);
// find the ones on the target strip.
const CAST = [
  "🐶", "🐱", "🦊", "🐰", "🐻", "🐼", "🐨", "🐵", "🦁", "🐯", "🐸", "🐷",
  "🐔", "🐧", "🐦", "🦉", "🦄", "🐝", "🦋", "🐢", "🐙", "🦖", "🦕", "🐳",
  "🐌", "🐞", "🦔", "🦇", "🐴", "🐮", "🐗", "🦒", "🦓", "🦩", "🦜", "🐡",
];

type Difficulty = "easy" | "medium" | "hard";

// Difficulty controls BOTH the crowd size (slice of CAST) and the target count.
const DIFFICULTIES: Record<Difficulty, { crowd: number; targets: number }> = {
  easy: { crowd: 16, targets: 3 },
  medium: { crowd: 24, targets: 4 },
  hard: { crowd: 32, targets: 5 },
};

const DIFF_ORDER: Difficulty[] = ["easy", "medium", "hard"];

const DIFF_LABEL: Record<Difficulty, { he: string; en: string }> = {
  easy: { he: "קל", en: "Easy" },
  medium: { he: "בינוני", en: "Med" },
  hard: { he: "קשה", en: "Hard" },
};

function shuffled<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Fresh random layout for a difficulty: a shuffled crowd slice + random targets.
function makeRound(difficulty: Difficulty): HiddenState {
  const cfg = DIFFICULTIES[difficulty];
  const crowd = shuffled(CAST).slice(0, cfg.crowd);
  return newGame(crowd, cfg.targets);
}

export function Hidden({ ctx }: { ctx: GameContext }) {
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [round, setRound] = useState(1);
  const [state, setState] = useState<HiddenState>(() => makeRound("easy"));
  const [justWon, setJustWon] = useState(false);
  const sceneRef = useRef<HTMLDivElement>(null);
  const started = useRef(false);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!started.current) {
      started.current = true;
      ctx.lifecycle.gameplayStart();
      ctx.analytics.levelStart("crowd");
    }
  }, [ctx]);

  // Clear any pending auto-advance timer on unmount.
  useEffect(() => () => {
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
  }, []);

  // Restart the CURRENT round (new layout, same difficulty + round counter).
  const reshuffle = useCallback(() => {
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    setState(makeRound(difficulty));
    setJustWon(false);
    ctx.analytics.levelStart("crowd");
  }, [ctx, difficulty]);

  // Switch difficulty — resets progression to round 1.
  const changeDifficulty = useCallback(
    (d: Difficulty) => {
      if (d === difficulty) return;
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
      setDifficulty(d);
      setRound(1);
      setState(makeRound(d));
      setJustWon(false);
      ctx.analytics.levelStart("crowd");
    },
    [ctx, difficulty],
  );

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
          setJustWon(true);
          ctx.audio.play("win");
          haptic.win();
          celebrate();
          ctx.analytics.levelComplete("crowd", 0);
          // Auto-advance to the next endless round, keeping difficulty.
          advanceTimer.current = setTimeout(() => {
            setRound((r) => r + 1);
            setState(makeRound(difficulty));
            setJustWon(false);
            ctx.analytics.levelStart("crowd");
          }, 1100);
        }
      } else if (result.kind === "not-target") {
        ctx.audio.play("tap");
        if (sceneRef.current) shake(sceneRef.current, 3, 130);
      }
    },
    [ctx, state, difficulty],
  );

  const targets = targetIcons(state);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: 12 }}>
      {/* Level indicator + difficulty selector */}
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", justifyContent: "center" }}>
        <Stat label={ctx.locale === "he" ? "שלב" : "Level"} value={round} />
        <div style={{ display: "flex", gap: 6 }}>
          {DIFF_ORDER.map((d) => (
            <Button
              key={d}
              kids
              variant={d === difficulty ? "primary" : "ghost"}
              ariaLabel={`difficulty ${d}`}
              onClick={() => changeDifficulty(d)}
              style={{ fontSize: 16, padding: "0 var(--space-3)" }}
            >
              {ctx.locale === "he" ? DIFF_LABEL[d].he : DIFF_LABEL[d].en}
            </Button>
          ))}
        </div>
      </div>

      {/* Target strip: the characters to find */}
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", justifyContent: "center" }}>
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
        <Button variant="ghost" kids ariaLabel="new layout" onClick={reshuffle}>
          🔄
        </Button>
      </div>

      {/* The crowd */}
      <div
        ref={sceneRef}
        className="ellaz-play-surface"
        style={{
          position: "relative",
          width: "min(94vw, 54vh, 560px)",
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

      {justWon ? (
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 40 }}>🎉</div>
          <div style={{ color: "var(--text-dim)", fontSize: 13 }}>
            {ctx.locale === "he" ? `שלב ${round} הושלם! ממשיכים…` : `Level ${round} done! Next up…`}
          </div>
        </div>
      ) : (
        <div style={{ color: "var(--text-dim)", fontSize: 13 }}>
          {ctx.locale === "he" ? "איפה הם מתחבאים? 👀" : "Where are they hiding? 👀"}
        </div>
      )}
    </div>
  );
}
