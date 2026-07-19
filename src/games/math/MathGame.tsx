import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import type { GameContext } from "@sdk/index";
import { Stat } from "@ui/components";
import { burst, shake, haptic } from "@juice/index";
import { generateProblem, isCorrect, type Problem } from "./logic";

export function MathGame({ ctx }: { ctx: GameContext }) {
  const [problem, setProblem] = useState<Problem>(() => generateProblem());
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState(() => ctx.storage.get("best", 0));
  const [wrongChoice, setWrongChoice] = useState<number | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    if (!started.current) {
      started.current = true;
      ctx.lifecycle.gameplayStart();
      ctx.analytics.levelStart("addsub10");
    }
  }, [ctx]);

  const next = useCallback(() => {
    setProblem(generateProblem());
    setWrongChoice(null);
  }, []);

  const answer = useCallback(
    (choice: number, e: ReactPointerEvent) => {
      ctx.audio.unlock();
      if (isCorrect(problem, choice)) {
        ctx.audio.play("success");
        haptic.success();
        burst(e.clientX, e.clientY, { count: 12 });
        setScore((s) => s + 1);
        setStreak((s) => {
          const ns = s + 1;
          setBest((b) => {
            const nb = Math.max(b, ns);
            ctx.storage.set("best", nb);
            return nb;
          });
          return ns;
        });
        ctx.analytics.levelComplete("addsub10", 0);
        next();
      } else {
        // Gentle: shake the wrong answer, reset streak, let them try again.
        ctx.audio.play("fail");
        haptic.fail();
        setStreak(0);
        setWrongChoice(choice);
        if (cardRef.current) shake(cardRef.current, 5, 200);
        ctx.analytics.levelFail("addsub10", "wrong");
      }
    },
    [ctx, problem, next],
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 22, padding: 16 }}>
      <div style={{ display: "flex", gap: 10 }}>
        <Stat label={ctx.locale === "he" ? "נקודות" : "Score"} value={score} />
        <Stat label={ctx.locale === "he" ? "רצף" : "Streak"} value={`${streak} 🔥`} />
        <Stat label={ctx.t("best")} value={best} />
      </div>

      <div
        ref={cardRef}
        style={{
          background: "linear-gradient(180deg,#2b3170,#1c2150)",
          borderRadius: 24,
          padding: "28px 24px",
          minWidth: "min(88vw, 360px)",
          textAlign: "center",
          boxShadow: "var(--shadow-2)",
        }}
      >
        <div
          style={{
            fontSize: "clamp(44px, 15vw, 84px)",
            fontWeight: 800,
            lineHeight: 1.1,
            letterSpacing: 2,
          }}
        >
          {problem.a} {problem.op} {problem.b} = <span style={{ color: "var(--yellow)" }}>?</span>
        </div>
      </div>

      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center" }}>
        {problem.choices.map((c) => {
          const isWrong = wrongChoice === c;
          return (
            <button
              key={c}
              aria-label={`answer ${c}`}
              onPointerDown={(e) => answer(c, e)}
              style={{
                width: "var(--tap-kids)",
                height: "var(--tap-kids)",
                minWidth: 72,
                minHeight: 72,
                border: "none",
                borderRadius: 20,
                background: isWrong ? "var(--red)" : "linear-gradient(180deg,var(--brand-2),var(--brand))",
                color: "#fff",
                fontSize: 34,
                fontWeight: 800,
                boxShadow: "var(--shadow-1)",
              }}
            >
              {c}
            </button>
          );
        })}
      </div>

      <div style={{ color: "var(--text-dim)", fontSize: 14 }}>
        {ctx.locale === "he" ? "בחרו את התשובה הנכונה ➕➖" : "Tap the right answer ➕➖"}
      </div>
    </div>
  );
}
