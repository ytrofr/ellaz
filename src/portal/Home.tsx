import type { Locale } from "@i18n/index";
import { makeT } from "@i18n/index";
import { CATALOG, type CatalogEntry } from "./catalog";
import { audioPort } from "@sdk/index";

// Home grid: icon-first game cards grouped by category. Tapping a card opens the
// game; hovering/touching prefetches its chunk for instant load.
export function Home({
  locale,
  onOpen,
  onToggleLocale,
}: {
  locale: Locale;
  onOpen: (id: string) => void;
  onToggleLocale: () => void;
}) {
  const t = makeT(locale);
  const kids = CATALOG.filter((e) => e.meta.category === "kids");
  const classics = CATALOG.filter((e) => e.meta.category === "classics");

  return (
    <div className="ellaz-scroll" style={{ flex: 1, padding: "8px 16px 32px" }}>
      <header
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "12px 4px 20px",
        }}
      >
        <div style={{ fontSize: 40 }}>🎮</div>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 30, lineHeight: 1 }}>{t("appName")}</h1>
          <div style={{ color: "var(--text-dim)", fontSize: 14 }}>{t("tagline")}</div>
        </div>
        <button
          aria-label={t("language")}
          onClick={onToggleLocale}
          style={{
            minHeight: "var(--tap)",
            padding: "0 16px",
            borderRadius: "var(--radius-pill)",
            border: "none",
            background: "var(--surface-2)",
            color: "var(--text)",
            fontWeight: 800,
            fontSize: 15,
          }}
        >
          {locale === "he" ? "EN" : "עב"}
        </button>
      </header>

      <Section title={t("forKids")} entries={kids} locale={locale} onOpen={onOpen} />
      <Section title={t("classics")} entries={classics} locale={locale} onOpen={onOpen} />

      <p style={{ color: "var(--text-dim)", fontSize: 13, textAlign: "center", marginTop: 28 }}>
        📲 {t("installHint")}
      </p>
    </div>
  );
}

function Section({
  title,
  entries,
  locale,
  onOpen,
}: {
  title: string;
  entries: CatalogEntry[];
  locale: Locale;
  onOpen: (id: string) => void;
}) {
  return (
    <section style={{ marginBottom: 24 }}>
      <h2 style={{ fontSize: 18, margin: "0 4px 12px", color: "var(--text-dim)" }}>{title}</h2>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
          gap: 14,
        }}
      >
        {entries.map((e) => (
          <GameCard key={e.meta.id} entry={e} locale={locale} onOpen={onOpen} />
        ))}
      </div>
    </section>
  );
}

function GameCard({
  entry,
  locale,
  onOpen,
}: {
  entry: CatalogEntry;
  locale: Locale;
  onOpen: (id: string) => void;
}) {
  const { meta } = entry;
  // Warm the chunk on hover/touch so opening is instant.
  const prefetch = () => void entry.load().catch(() => {});
  return (
    <button
      onPointerEnter={prefetch}
      onTouchStart={prefetch}
      onClick={() => {
        audioPort.unlock();
        audioPort.play("tap");
        onOpen(meta.id);
      }}
      style={{
        border: "none",
        borderRadius: "var(--radius-3)",
        padding: 0,
        overflow: "hidden",
        background: "var(--surface)",
        boxShadow: "var(--shadow-1)",
        textAlign: "center",
        aspectRatio: "1 / 1",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          flex: 1,
          display: "grid",
          placeItems: "center",
          fontSize: 56,
          background: `radial-gradient(120px 90px at 50% 30%, ${meta.color}33, transparent), var(--surface)`,
        }}
      >
        {meta.emoji}
      </div>
      <div
        style={{
          padding: "10px 6px",
          fontWeight: 800,
          fontSize: 17,
          background: meta.color,
          color: "#1b1b2b",
        }}
      >
        {meta.title[locale]}
      </div>
    </button>
  );
}
