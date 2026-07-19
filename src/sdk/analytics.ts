import posthog from "posthog-js";
import type { AnalyticsPort } from "./types";

// Anonymous, kid-safe analytics behind a port so the backend is swappable.
// COPPA "internal operations": anonymous events only — never identify(), no PII,
// no autocapture, no session replay, no behavioral ads. Everything is
// best-effort: analytics failure must never block gameplay.
let started = false;

function init(): void {
  if (started) return;
  started = true;
  const key = import.meta.env.VITE_POSTHOG_KEY as string | undefined;
  const host =
    (import.meta.env.VITE_POSTHOG_HOST as string | undefined) ?? "https://us.i.posthog.com";
  if (!key) {
    // No key configured (e.g. local dev) — events log to console in dev, silent in prod.
    return;
  }
  try {
    posthog.init(key, {
      api_host: host,
      autocapture: false,
      capture_pageview: false,
      disable_session_recording: true,
      persistence: "localStorage",
      // anonymous mode: no person profiles are created unless we identify() (we never do)
      person_profiles: "never",
      respect_dnt: true,
    });
  } catch {
    /* ignore */
  }
}

function emit(event: string, props?: Record<string, unknown>): void {
  try {
    const key = import.meta.env.VITE_POSTHOG_KEY as string | undefined;
    if (key && started) {
      posthog.capture(event, props);
    } else if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.debug("[ellaz:analytics]", event, props ?? {});
    }
  } catch {
    /* never throw from analytics */
  }
}

/** Portal-level analytics (session, navigation). */
export const analytics = {
  init,
  track: emit,
};

/** Per-game analytics port, auto-tags gameId + the level taxonomy. */
export function createAnalyticsPort(gameId: string): AnalyticsPort {
  const tag = (props?: Record<string, unknown>) => ({ game: gameId, ...props });
  return {
    track: (event, props) => emit(event, tag(props)),
    levelStart: (level) => emit("level_start", tag({ level })),
    levelComplete: (level, ms) => emit("level_complete", tag({ level, ms })),
    levelFail: (level, why) => emit("level_fail", tag({ level, why })),
  };
}
