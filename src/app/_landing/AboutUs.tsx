"use client";

import { useI18n } from "@/i18n/LocaleContext";

const ANTON = "var(--font-anton), 'Anton', 'Arial Narrow', sans-serif";
const GROTESK = "var(--font-space-grotesk), 'Space Grotesk', system-ui, sans-serif";
const JMONO = "var(--font-jetbrains), 'JetBrains Mono', ui-monospace, monospace";

const BLUE = "#0d6ef2";
const AMBER = "#f59e0b";
const VIOLET = "#8b5cf6";
const GREEN = "#16a34a";

type Industry = "salud" | "finanzas" | "banca" | "seguros";

function IndustryIcon({ name }: { name: Industry }) {
  const paths: Record<string, React.ReactNode> = {
    salud: <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.8z" />,
    finanzas: (
      <>
        <polyline points="3 17 9 11 13 15 21 7" />
        <polyline points="14 7 21 7 21 14" />
      </>
    ),
    banca: <path d="M3 21h18M5 21V10M19 21V10M3 10l9-6 9 6M9 21v-6h6v6" />,
    seguros: <path d="M12 2.5 4.5 5.5V11c0 5 3.2 8.6 7.5 10.5 4.3-1.9 7.5-5.5 7.5-10.5V5.5L12 2.5z" />,
  };
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {paths[name]}
    </svg>
  );
}

function IndustryPill({ name, color, label }: { name: Industry; color: string; label: string }) {
  return (
    <span
      className="inline-flex items-center gap-2"
      style={{
        fontFamily: GROTESK,
        fontSize: "0.88rem",
        fontWeight: 600,
        color: "var(--fg)",
        background: `color-mix(in srgb, ${color} 8%, var(--surface))`,
        border: `1px solid color-mix(in srgb, ${color} 28%, var(--border))`,
        borderRadius: 999,
        padding: "0.45rem 0.95rem 0.45rem 0.6rem",
      }}
    >
      <span
        aria-hidden
        className="flex items-center justify-center shrink-0"
        style={{ width: 24, height: 24, borderRadius: "50%", background: `color-mix(in srgb, ${color} 16%, var(--surface))`, color }}
      >
        <IndustryIcon name={name} />
      </span>
      {label}
    </span>
  );
}

/** "Quiénes somos": quién hay detrás de Kroomix, justo debajo de la llamada directa. */
export default function AboutUs() {
  const { t } = useI18n();
  return (
    <section className="px-6" style={{ paddingTop: 0, paddingBottom: "clamp(3.5rem, 8vh, 5.5rem)" }}>
      <div
        className="max-w-[1120px] mx-auto flex flex-col items-center text-center"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 20,
          padding: "clamp(2.25rem, 6vh, 3.5rem) clamp(1.5rem, 6vw, 4rem)",
        }}
      >
        <span
          style={{
            fontFamily: JMONO,
            fontSize: "0.72rem",
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase" as const,
            color: "var(--accent)",
          }}
        >
          {t("v3.about.eyebrow")}
        </span>

        <h2
          style={{
            fontFamily: ANTON,
            fontSize: "clamp(1.6rem, 3.2vw, 2.5rem)",
            fontWeight: 400,
            letterSpacing: "-0.005em",
            lineHeight: 1.12,
            color: "var(--fg)",
            margin: "0.6rem 0 1.1rem",
            maxWidth: "24ch",
          }}
        >
          {t("v3.about.heading")}
        </h2>

        <p
          style={{
            fontFamily: GROTESK,
            fontSize: "1.05rem",
            lineHeight: 1.6,
            color: "var(--muted-hi)",
            maxWidth: "58ch",
            margin: "0 0 1.25rem",
          }}
        >
          {t("v3.about.body")}
        </p>

        <p
          style={{
            fontFamily: GROTESK,
            fontSize: "1.05rem",
            fontWeight: 600,
            lineHeight: 1.6,
            color: "var(--fg)",
            maxWidth: "58ch",
            margin: "0 0 1.75rem",
          }}
        >
          {t("v3.about.positioning")}
        </p>

        <div className="flex flex-wrap items-center justify-center gap-2.5" style={{ marginBottom: "2rem" }}>
          <IndustryPill name="salud" color={BLUE} label={t("v3.about.iSalud")} />
          <IndustryPill name="finanzas" color={AMBER} label={t("v3.about.iFinanzas")} />
          <IndustryPill name="banca" color={VIOLET} label={t("v3.about.iBanca")} />
          <IndustryPill name="seguros" color={GREEN} label={t("v3.about.iSeguros")} />
        </div>

        <div
          className="flex items-baseline gap-2"
          style={{ paddingTop: "1.5rem", borderTop: "1px solid var(--border)", width: "100%", maxWidth: 420, justifyContent: "center" }}
        >
          <span style={{ fontFamily: JMONO, fontSize: "1.9rem", fontWeight: 700, color: BLUE, whiteSpace: "nowrap" }}>
            {t("v3.about.statValue")}
          </span>
          <span style={{ fontSize: "0.9rem", color: "var(--muted)", textAlign: "left" as const }}>{t("v3.about.statLabel")}</span>
        </div>

        <p
          style={{
            fontFamily: GROTESK,
            fontSize: "0.98rem",
            lineHeight: 1.65,
            color: "var(--muted-hi)",
            maxWidth: "58ch",
            margin: "2rem 0 0",
          }}
        >
          {t("v3.about.why")}
        </p>
      </div>
    </section>
  );
}
