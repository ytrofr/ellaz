import { useEffect, useState } from "react";
import type { Locale } from "@i18n/index";
import { DIR } from "@i18n/index";
import { analytics } from "@sdk/index";
import { Home } from "./Home";
import { GameHost } from "./GameHost";

const LOCALE_KEY = "ellaz:locale";

function initialLocale(): Locale {
  try {
    const saved = localStorage.getItem(LOCALE_KEY);
    if (saved === "he" || saved === "en") return saved;
  } catch {
    /* ignore */
  }
  return "he";
}

// Root shell: owns locale + which game (if any) is open. A tiny hash router keeps
// deep links + browser Back working without a routing dependency.
export function App() {
  const [locale, setLocale] = useState<Locale>(initialLocale);
  const [gameId, setGameId] = useState<string | null>(() => hashGame());

  useEffect(() => {
    analytics.init();
    analytics.track("session_start", { locale });
    const onHash = () => setGameId(hashGame());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = DIR[locale];
  }, [locale]);

  const open = (id: string) => {
    window.location.hash = `#/game/${id}`;
    setGameId(id);
  };
  const exit = () => {
    window.location.hash = "";
    setGameId(null);
  };
  const toggleLocale = () => {
    const next: Locale = locale === "he" ? "en" : "he";
    setLocale(next);
    try {
      localStorage.setItem(LOCALE_KEY, next);
    } catch {
      /* ignore */
    }
  };

  return gameId ? (
    <GameHost gameId={gameId} locale={locale} onExit={exit} />
  ) : (
    <Home locale={locale} onOpen={open} onToggleLocale={toggleLocale} />
  );
}

function hashGame(): string | null {
  const m = window.location.hash.match(/^#\/game\/(.+)$/);
  return m ? m[1] : null;
}
