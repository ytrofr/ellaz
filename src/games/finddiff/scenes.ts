import type { Diff } from "./logic";

// A scene: a shared base picture plus a set of differences. Each difference
// renders one way on the LEFT picture and another on the RIGHT, and carries a
// tap center/radius (matched to the logic Diff) so taps near it count.
export interface SceneDiff extends Diff {
  left: string; // SVG fragment for the left picture
  right: string; // SVG fragment for the right picture
}
export interface Scene {
  id: string;
  name: { he: string; en: string };
  viewBox: string;
  base: string; // static SVG fragment shared by both pictures
  diffs: SceneDiff[];
}

// One hand-authored garden scene with 5 differences (original shapes only).
export const SCENES: Scene[] = [
  {
    id: "garden",
    name: { he: "גן", en: "Garden" },
    viewBox: "0 0 100 100",
    base: `
      <rect x="0" y="0" width="100" height="64" fill="#afe3ff"/>
      <rect x="0" y="64" width="100" height="36" fill="#8ed67a"/>
      <rect x="40" y="40" width="30" height="26" fill="#f7c873"/>
      <polygon points="38,40 55,26 72,40" fill="#e07a5f"/>
      <rect x="50" y="52" width="10" height="14" fill="#6d4c41"/>
    `,
    diffs: [
      {
        id: "sun",
        cx: 15,
        cy: 15,
        r: 12,
        left: `<circle cx="15" cy="15" r="9" fill="#ffd93b"/>`,
        right: `<circle cx="15" cy="15" r="9" fill="#ff914d"/>`,
      },
      {
        id: "cloud",
        cx: 80,
        cy: 16,
        r: 12,
        left: `<ellipse cx="80" cy="16" rx="12" ry="6" fill="#ffffff"/>`,
        right: ``, // cloud missing on the right
      },
      {
        id: "window",
        cx: 46,
        cy: 48,
        r: 8,
        left: `<rect x="43" y="45" width="6" height="6" fill="#ffffff"/>`,
        right: `<rect x="43" y="45" width="6" height="6" fill="#4d7cff"/>`,
      },
      {
        id: "flower",
        cx: 20,
        cy: 80,
        r: 10,
        left: `<circle cx="20" cy="80" r="4" fill="#ff5d8f"/><rect x="19" y="80" width="2" height="10" fill="#2e7d32"/>`,
        right: ``, // flower missing on the right
      },
      {
        id: "bird",
        cx: 84,
        cy: 44,
        r: 10,
        left: ``, // bird only on the right
        right: `<path d="M78 44 q3 -4 6 0 q3 -4 6 0" stroke="#333" stroke-width="1.6" fill="none"/>`,
      },
    ],
  },
];

export function diffsOf(scene: Scene): Diff[] {
  return scene.diffs.map(({ id, cx, cy, r }) => ({ id, cx, cy, r }));
}
