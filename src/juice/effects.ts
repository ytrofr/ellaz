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

// A full-screen confetti celebration raining from the top — the big "you did it"
// reward moment. Heavier than burst(); use it for wins and milestones.
export function celebrate(opts: { count?: number; colors?: string[] } = {}): void {
  const count = opts.count ?? 60;
  const colors = opts.colors ?? [
    "#6c5ce7", "#a29bfe", "#00cec9", "#fdcb6e", "#ff7675", "#55efc4", "#fd79a8", "#74b9ff",
  ];
  const layer = document.createElement("div");
  layer.style.cssText =
    "position:fixed;inset:0;pointer-events:none;z-index:10000;overflow:hidden";
  document.body.appendChild(layer);
  const W = window.innerWidth;
  const H = window.innerHeight;
  for (let i = 0; i < count; i++) {
    const p = document.createElement("div");
    const size = 7 + Math.random() * 9;
    const startX = Math.random() * W;
    p.style.cssText =
      `position:absolute;left:${startX}px;top:-20px;width:${size}px;height:${size * 0.6}px;` +
      `background:${colors[i % colors.length]};border-radius:2px;`;
    layer.appendChild(p);
    const driftX = (Math.random() * 2 - 1) * 120;
    const spins = 2 + Math.random() * 4;
    p.animate(
      [
        { transform: "translate(0,0) rotate(0deg)", opacity: 1 },
        { transform: `translate(${driftX}px, ${H + 60}px) rotate(${spins * 360}deg)`, opacity: 0.9 },
      ],
      { duration: 1600 + Math.random() * 1200, easing: "cubic-bezier(.25,.6,.4,1)", delay: Math.random() * 400 },
    );
  }
  setTimeout(() => layer.remove(), 2600);
}

/** Add a one-shot CSS animation class to an element, auto-removed on finish. */
export function popEl(el: HTMLElement, cls = "ellaz-pop"): void {
  el.classList.remove(cls);
  // reflow to restart the animation if the class was present
  void el.offsetWidth;
  el.classList.add(cls);
  const done = () => {
    el.classList.remove(cls);
    el.removeEventListener("animationend", done);
  };
  el.addEventListener("animationend", done);
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
