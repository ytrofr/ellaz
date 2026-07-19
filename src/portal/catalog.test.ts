import { describe, it, expect } from "vitest";
import { CATALOG, findEntry } from "./catalog";

describe("catalog", () => {
  it("has unique game ids", () => {
    const ids = CATALOG.map((e) => e.meta.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("includes the expected games", () => {
    const ids = CATALOG.map((e) => e.meta.id).sort();
    expect(ids).toEqual([
      "2048",
      "coloring",
      "finddiff",
      "hidden",
      "memory",
      "snake",
      "tictactoe",
    ]);
  });

  it("every entry has both locales and a loader", () => {
    for (const e of CATALOG) {
      expect(e.meta.title.he).toBeTruthy();
      expect(e.meta.title.en).toBeTruthy();
      expect(typeof e.load).toBe("function");
      expect(["dom", "phaser"]).toContain(e.meta.renderer);
    }
  });

  it("findEntry resolves a known id and rejects unknown", () => {
    expect(findEntry("snake")?.meta.id).toBe("snake");
    expect(findEntry("nope")).toBeUndefined();
  });
});
