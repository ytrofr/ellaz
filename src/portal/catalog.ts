import type { GameMeta, GameModule } from "@sdk/index";

// The catalog: static metadata for the home grid + a lazy loader per game.
// Each loader dynamic-imports the game so its code (and Phaser, for canvas games)
// is only downloaded when the player opens it.
export interface CatalogEntry {
  meta: GameMeta;
  load: () => Promise<{ default: GameModule }>;
}

// Metadata is duplicated lightly here so the home grid renders instantly without
// importing any game code. It is asserted against each module's own meta in tests.
export const CATALOG: CatalogEntry[] = [
  {
    meta: {
      id: "memory",
      title: { he: "זיכרון", en: "Memory" },
      emoji: "🧠",
      color: "#fd79a8",
      ageBand: "kids",
      category: "kids",
      orientation: "any",
      renderer: "dom",
    },
    load: () => import("../games/memory/index"),
  },
  {
    meta: {
      id: "coloring",
      title: { he: "צביעה", en: "Coloring" },
      emoji: "🎨",
      color: "#ffa94d",
      ageBand: "kids",
      category: "kids",
      orientation: "any",
      renderer: "dom",
    },
    load: () => import("../games/coloring/index"),
  },
  {
    meta: {
      id: "2048",
      title: { he: "2048", en: "2048" },
      emoji: "🔢",
      color: "#edc22e",
      ageBand: "all",
      category: "classics",
      orientation: "any",
      renderer: "dom",
    },
    load: () => import("../games/n2048/index"),
  },
  {
    meta: {
      id: "snake",
      title: { he: "נחש", en: "Snake" },
      emoji: "🐍",
      color: "#55efc4",
      ageBand: "all",
      category: "classics",
      orientation: "any",
      renderer: "phaser",
    },
    load: () => import("../games/snake/index"),
  },
];

export function findEntry(id: string): CatalogEntry | undefined {
  return CATALOG.find((e) => e.meta.id === id);
}
