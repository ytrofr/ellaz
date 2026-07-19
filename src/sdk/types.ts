// Ellaz Game SDK — the single contract every game implements.
// Framework-neutral on purpose: a game receives a mount element and plain
// services, so DOM (React) and canvas (Phaser) games share one interface, and
// the lifecycle/ads shape matches the Poki + CrazyGames union for later portability.
import type { Locale } from "@i18n/index";

export interface SaveStore {
  get<T>(key: string, fallback: T): T;
  set<T>(key: string, value: T): void;
  remove(key: string): void;
}

export interface AnalyticsPort {
  track(event: string, props?: Record<string, unknown>): void;
  levelStart(level: string): void;
  levelComplete(level: string, ms: number): void;
  levelFail(level: string, why?: string): void;
}

export interface AudioPort {
  readonly muted: boolean;
  toggleMute(): void;
  onMuteChange(cb: (muted: boolean) => void): () => void;
  /** Play a named short SFX. No-ops if muted or asset missing (best-effort). */
  play(name: SfxName): void;
  /** Must be called inside a user gesture to unlock audio on iOS. */
  unlock(): void;
}

export type SfxName = "tap" | "success" | "win" | "fail" | "flip" | "pop";

export interface LifecyclePort {
  loadingStart(): void;
  loadingFinished(): void;
  gameplayStart(): void;
  gameplayStop(): void;
}

export interface AdsPort {
  // No-op stubs in v1. Present so games written now list on Poki/CrazyGames later
  // with zero rewrites. interstitial() resolves when the (non-existent) ad ends;
  // rewarded() resolves true if the reward was granted.
  interstitial(): Promise<void>;
  rewarded(): Promise<boolean>;
}

export interface GameContext {
  mount: HTMLElement;
  locale: Locale;
  dir: "rtl" | "ltr";
  t(key: string): string;
  storage: SaveStore;
  analytics: AnalyticsPort;
  audio: AudioPort;
  lifecycle: LifecyclePort;
  ads: AdsPort;
  /** Portal asks the game to exit back to the home grid. */
  onRequestExit(cb: () => void): void;
  requestExit(): void;
  onPause(cb: () => void): () => void;
  onResume(cb: () => void): () => void;
  onResize(cb: (w: number, h: number) => void): () => void;
}

export type AgeBand = "kids" | "all";
export type Renderer = "dom" | "phaser";
export type Category = "kids" | "classics";

export interface GameMeta {
  id: string;
  title: Record<Locale, string>;
  emoji: string; // simple icon for the home grid (icon-first, kid-friendly)
  color: string; // card accent
  ageBand: AgeBand;
  category: Category;
  orientation: "portrait" | "landscape" | "any";
  renderer: Renderer;
}

export interface GameModule {
  meta: GameMeta;
  /** Mount the game into ctx.mount. Resolve once interactive. */
  mount(ctx: GameContext): Promise<void>;
  /** Tear down: stop loops, remove listeners, free the mount element's children. */
  unmount(): void;
}
