// Ellaz UI strings — Hebrew (default) + English. Games carry their own titles in
// their GameModule.meta; this file is portal-shell chrome only.
export type Locale = "he" | "en";

export const LOCALES: Locale[] = ["he", "en"];

export const DIR: Record<Locale, "rtl" | "ltr"> = { he: "rtl", en: "ltr" };

type Dict = Record<string, Record<Locale, string>>;

export const STRINGS: Dict = {
  appName: { he: "אלז", en: "Ellaz" },
  tagline: { he: "משחקים לכל המשפחה", en: "Games for everyone" },
  play: { he: "שחקו", en: "Play" },
  back: { he: "חזרה", en: "Back" },
  restart: { he: "מהתחלה", en: "Restart" },
  score: { he: "ניקוד", en: "Score" },
  best: { he: "שיא", en: "Best" },
  youWon: { he: "כל הכבוד!", en: "You win!" },
  gameOver: { he: "המשחק נגמר", en: "Game over" },
  loading: { he: "טוען…", en: "Loading…" },
  sound: { he: "צליל", en: "Sound" },
  language: { he: "שפה", en: "Language" },
  rotateHint: { he: "סובבו את המכשיר", en: "Rotate your device" },
  allGames: { he: "כל המשחקים", en: "All games" },
  forKids: { he: "לילדים", en: "For kids" },
  classics: { he: "קלאסי", en: "Classics" },
  moves: { he: "מהלכים", en: "Moves" },
  pairs: { he: "זוגות", en: "Pairs" },
  pickColor: { he: "בחרו צבע", en: "Pick a color" },
  installHint: {
    he: "הוסיפו למסך הבית למשחק גם בלי אינטרנט",
    en: "Add to home screen to play offline",
  },
};

export function makeT(locale: Locale) {
  return (key: string): string => STRINGS[key]?.[locale] ?? key;
}
