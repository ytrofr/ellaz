// DOM game-feel effects: screen shake, success particle burst, and a tiny
// rAF tween. Kept framework-neutral (plain elements) so any renderer can use them.

export function shake(el: HTMLElement, intensity = 6, ms = 240): void {
  const start = performance.now();
  const base = el.style.transform;
  function frame(now: number) {
    const p = (now - start) / ms;
    if (p >= 1) {
      el.style.transform = base;
      return;
    }
    const decay = 1 - p;
    const dx = (Math.random() * 2 - 1) * intensity * decay;
    const dy = (Math.random() * 2 - 1) * intensity * decay;
    el.style.transform = `${base} translate(${dx}px, ${dy}px)`;
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

export interface BurstOptions {
  count?: number;
  colors?: string[];
  spread?: number;
}

// Confetti-style burst at a screen point. Elements are absolutely positioned,
// animated with the Web Animations API, and self-remove on finish.
export function burst(x: number, y: number, opts: BurstOptions = {}): void {
  const count = opts.count ?? 14;
  const colors = opts.colors ?? ["#6c5ce7", "#00cec9", "#fdcb6e", "#ff7675", "#55efc4"];
  const spread = opts.spread ?? 90;
  const layer = document.createElement("div");
  layer.style.cssText = `position:fixed;left:0;top:0;pointer-events:none;z-index:9999`;
  document.body.appendChild(layer);
  for (let i = 0; i < count; i++) {
    const p = document.createElement("div");
    const size = 6 + Math.random() * 8;
    p.style.cssText =
      `position:absolute;left:${x}px;top:${y}px;width:${size}px;height:${size}px;` +
      `border-radius:${Math.random() > 0.5 ? "50%" : "2px"};` +
      `background:${colors[i % colors.length]}`;
    layer.appendChild(p);
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.6;
    const dist = spread + Math.random() * spread;
    const dx = Math.cos(angle) * dist;
    const dy = Math.sin(angle) * dist - 30;
    p.animate(
      [
        { transform: "translate(0,0) scale(1)", opacity: 1 },
        { transform: `translate(${dx}px, ${dy + 120}px) scale(0.3)`, opacity: 0 },
      ],
      { duration: 700 + Math.random() * 300, easing: "cubic-bezier(.2,.6,.3,1)" },
    );
  }
  setTimeout(() => layer.remove(), 1100);
}

/** Minimal eased tween on a numeric value. Returns a cancel function. */
export function tween(
  from: number,
  to: number,
  ms: number,
  onUpdate: (v: number) => void,
  ease: (t: number) => number = (t) => 1 - Math.pow(1 - t, 3),
): () => void {
  const start = performance.now();
  let raf = 0;
  function frame(now: number) {
    const p = Math.min(1, (now - start) / ms);
    onUpdate(from + (to - from) * ease(p));
    if (p < 1) raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return () => cancelAnimationFrame(raf);
}
