"use client";

import { useI18n } from "@/i18n/LocaleContext";

const ANTON = "var(--font-anton), 'Anton', 'Arial Narrow', sans-serif";
const GROTESK = "var(--font-space-grotesk), 'Space Grotesk', system-ui, sans-serif";
const JMONO = "var(--font-jetbrains), 'JetBrains Mono', ui-monospace, monospace";

const BLUE = "#0d6ef2";
const AMBER = "#f59e0b";

/** Icono del sector de cada proyecto. */
function SectorIcon({ name }: { name: "drone" | "ruler" }) {
  const paths: Record<string, React.ReactNode> = {
    drone: (
      <>
        <rect x="9" y="9" width="6" height="6" rx="1" />
        <path d="M9 9 4 4M15 9l5-5M9 15l-5 5M15 15l5 5" />
        <circle cx="4" cy="4" r="1.6" />
        <circle cx="20" cy="4" r="1.6" />
        <circle cx="4" cy="20" r="1.6" />
        <circle cx="20" cy="20" r="1.6" />
      </>
    ),
    ruler: (
      <>
        <path d="M3 17 17 3l4 4L7 21l-4-4z" />
        <path d="M14.5 5.5 17 8M11 9l2 2M7.5 12.5l2 2" />
      </>
    ),
  };
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {paths[name]}
    </svg>
  );
}

function CaseCard({
  icon,
  color,
  sector,
  problemLabel,
  problem,
  solutionLabel,
  solution,
  statValue,
  statLabel,
}: {
  icon: "drone" | "ruler";
  color: string;
  sector: string;
  problemLabel: string;
  problem: string;
  solutionLabel: string;
  solution: string;
  statValue: string;
  statLabel: string;
}) {
  return (
    <article
      className="v3-hover flex flex-col"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 16,
        boxShadow: "0 1px 2px rgba(16,20,24,0.05)",
        padding: "1.6rem 1.75rem",
        "--hover-border": `color-mix(in srgb, ${color} 45%, var(--surface))`,
      } as React.CSSProperties}
    >
      <div className="flex items-center gap-2.5" style={{ marginBottom: "1.25rem" }}>
        <span
          aria-hidden
          className="flex items-center justify-center shrink-0"
          style={{ width: 34, height: 34, borderRadius: 9, background: `color-mix(in srgb, ${color} 14%, var(--surface))`, color }}
        >
          <SectorIcon name={icon} />
        </span>
        <h3 style={{ fontFamily: GROTESK, fontSize: "1.02rem", fontWeight: 700, color: "var(--fg)", margin: 0 }}>{sector}</h3>
      </div>

      <div className="flex flex-col" style={{ gap: "1rem", flex: 1 }}>
        <div>
          <span
            style={{
              fontFamily: JMONO,
              fontSize: "0.68rem",
              fontWeight: 700,
              letterSpacing: "0.06em",
              textTransform: "uppercase" as const,
              color: "#dc2626",
            }}
          >
            {problemLabel}
          </span>
          <p style={{ fontSize: "0.9rem", lineHeight: 1.55, color: "var(--muted-hi)", margin: "0.35rem 0 0" }}>{problem}</p>
        </div>

        <div>
          <span
            style={{
              fontFamily: JMONO,
              fontSize: "0.68rem",
              fontWeight: 700,
              letterSpacing: "0.06em",
              textTransform: "uppercase" as const,
              color,
            }}
          >
            {solutionLabel}
          </span>
          <p style={{ fontSize: "0.9rem", lineHeight: 1.55, color: "var(--muted-hi)", margin: "0.35rem 0 0" }}>{solution}</p>
        </div>
      </div>

      <div
        className="flex items-baseline gap-2"
        style={{ marginTop: "1.4rem", paddingTop: "1.1rem", borderTop: "1px solid var(--border)" }}
      >
        <span style={{ fontFamily: JMONO, fontSize: "1.7rem", fontWeight: 700, color, whiteSpace: "nowrap", flexShrink: 0 }}>{statValue}</span>
        <span style={{ fontSize: "0.85rem", color: "var(--muted)", lineHeight: 1.3 }}>{statLabel}</span>
      </div>
    </article>
  );
}

/** Sección "Proyectos realizados": casos reales ya entregados, fuera del recorrido de "Cómo lo hacemos". */
export default function CaseStudies() {
  const { t } = useI18n();
  return (
    <section
      className="px-6"
      style={{
        borderTop: "1px solid var(--border)",
        paddingTop: "clamp(2.5rem, 6vh, 4rem)",
        paddingBottom: "clamp(2.5rem, 6vh, 4rem)",
      }}
    >
      <div className="max-w-[1120px] mx-auto">
        <div className="text-center" style={{ marginBottom: "clamp(2rem, 5vh, 3rem)" }}>
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
            {t("v3.proyectos.eyebrow")}
          </span>
          <h2
            style={{
              fontFamily: ANTON,
              fontSize: "clamp(1.7rem, 3.6vw, 2.9rem)",
              fontWeight: 400,
              letterSpacing: "-0.005em",
              lineHeight: 1.1,
              color: "var(--fg)",
              margin: "0.5rem 0 0.6rem",
            }}
          >
            {t("v3.proyectos.heading")}
          </h2>
          <p style={{ fontFamily: GROTESK, fontSize: "1rem", color: "var(--muted)", margin: 0 }}>{t("v3.proyectos.sub")}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <CaseCard
            icon="drone"
            color={BLUE}
            sector={t("v3.proyectos.p1sector")}
            problemLabel={t("v3.proyectos.problemLabel")}
            problem={t("v3.proyectos.p1problem")}
            solutionLabel={t("v3.proyectos.solutionLabel")}
            solution={t("v3.proyectos.p1solution")}
            statValue={t("v3.proyectos.p1statValue")}
            statLabel={t("v3.proyectos.p1statLabel")}
          />
          <CaseCard
            icon="ruler"
            color={AMBER}
            sector={t("v3.proyectos.p2sector")}
            problemLabel={t("v3.proyectos.problemLabel")}
            problem={t("v3.proyectos.p2problem")}
            solutionLabel={t("v3.proyectos.solutionLabel")}
            solution={t("v3.proyectos.p2solution")}
            statValue={t("v3.proyectos.p2statValue")}
            statLabel={t("v3.proyectos.p2statLabel")}
          />
        </div>
      </div>
    </section>
  );
}
