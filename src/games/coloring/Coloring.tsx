import { useEffect, useRef, useState } from "react";
import type { GameContext } from "@sdk/index";
import { Button } from "@ui/components";
import { haptic } from "@juice/index";
import { PICTURES, PALETTE } from "./pictures";

// SVG region-fill coloring. Tap a color, tap a region — the region fills.
// Live SVG (not canvas) because per-region fill IS the mechanic here.
export function Coloring({ ctx }: { ctx: GameContext }) {
  const [picIdx, setPicIdx] = useState(0);
  const [color, setColor] = useState(PALETTE[0]);
  const [fills, setFills] = useState<Record<string, string>>({});
  const started = useRef(false);
  const pic = PICTURES[picIdx];

  useEffect(() => {
    if (!started.current) {
      started.current = true;
      ctx.lifecycle.gameplayStart();
      ctx.analytics.levelStart(pic.id);
    }
  }, [ctx, pic.id]);

  const paint = (regionId: string) => {
    ctx.audio.unlock();
    ctx.audio.play("pop");
    haptic.tap();
    setFills((f) => ({ ...f, [regionId]: color }));
    ctx.analytics.track("region_filled", { picture: pic.id, region: regionId });
  };

  const nextPicture = () => {
    const ni = (picIdx + 1) % PICTURES.length;
    setPicIdx(ni);
    setFills({});
    ctx.analytics.levelStart(PICTURES[ni].id);
  };

  const clearPage = () => setFills({});

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, padding: 12 }}>
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <Button variant="ghost" kids ariaLabel="clear" onClick={clearPage}>
          🧽
        </Button>
        <div style={{ fontWeight: 800, fontSize: 20 }}>{pic.name[ctx.locale]}</div>
        <Button variant="ghost" kids ariaLabel="next picture" onClick={nextPicture}>
          ➡
        </Button>
      </div>

      <div
        className="ellaz-play-surface"
        style={{
          width: "min(88vw, 380px)",
          aspectRatio: "1",
          background: "#fff",
          borderRadius: 18,
          boxShadow: "var(--shadow-1)",
          overflow: "hidden",
        }}
      >
        <svg viewBox={pic.viewBox} width="100%" height="100%" style={{ display: "block" }}>
          {pic.regions.map((r) => (
            <path
              key={r.id}
              d={r.d}
              fill={fills[r.id] ?? "#f4f4f8"}
              stroke="#2d3436"
              strokeWidth={2}
              strokeLinejoin="round"
              onPointerDown={() => paint(r.id)}
              style={{ cursor: "pointer" }}
            />
          ))}
        </svg>
      </div>

      {/* Color palette — big swatches, tap to select. */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(6, 1fr)",
          gap: 10,
          width: "min(88vw, 380px)",
        }}
      >
        {PALETTE.map((c) => (
          <button
            key={c}
            aria-label={`color ${c}`}
            aria-pressed={color === c}
            onClick={() => {
              setColor(c);
              ctx.audio.play("tap");
            }}
            style={{
              aspectRatio: "1",
              minHeight: 44,
              borderRadius: 12,
              border: color === c ? "4px solid var(--text)" : "2px solid rgba(255,255,255,0.25)",
              background: c,
              boxShadow: "var(--shadow-1)",
            }}
          />
        ))}
      </div>
      <div style={{ color: "var(--text-dim)", fontSize: 13 }}>{ctx.t("pickColor")} 🎨</div>
    </div>
  );
}
