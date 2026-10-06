"use client";

import { useI18n } from "@/i18n/LocaleContext";
import { seg, easeOut } from "./scrollProgress";

const GROTESK = "var(--font-space-grotesk), 'Space Grotesk', system-ui, sans-serif";
const JMONO = "var(--font-jetbrains), 'JetBrains Mono', ui-monospace, monospace";
const DARK_RED = "#7f1d1d";
const AMBER_FG = "#92400e";
const AMBER_BORDER = "#d97706";
const SLATE_FG = "#475569";

const PROCESS_COUNT = 6;
const CRITICAL_COUNT = 3;

/** Etiqueta en recuadro: el problema (ámbar/rojo) o la causa (gris, tras el "+"). */
function Tag({ text, tone, critical }: { text: string; tone: "problem" | "cause"; critical: boolean }) {
  const fg = tone === "problem" ? (critical ? DARK_RED : AMBER_FG) : SLATE_FG;
  const border = tone === "problem" ? (critical ? DARK_RED : AMBER_BORDER) : "rgba(100,116,139,0.45)";
  const bg = tone === "problem" ? (critical ? "rgba(127,29,29,0.08)" : "rgba(245,158,11,0.12)") : "rgba(100,116,139,0.1)";
  return (
    <span
      style={{
        fontFamily: JMONO,
        fontSize: "0.72rem",
        fontWeight: 700,
        color: fg,
        background: bg,
        border: `1px ${tone === "cause" ? "dashed" : "solid"} ${border}`,
        borderRadius: 6,
        padding: "0.2rem 0.5rem",
        transition: "color 0.2s ease, border-color 0.2s ease, background 0.2s ease",
      }}
    >
      {text}
    </span>
  );
}

/** Hoja DIN A4 animada: lista los procesos uno a uno al hacer scroll, cada uno con su problema y su causa, y marca los más críticos en rojo. */
export default function ProcessSheet({ progress, fill = false }: { progress: number; fill?: boolean }) {
  const { t } = useI18n();
  const rows = Array.from({ length: PROCESS_COUNT }, (_, i) => i + 1);

  /* La propia hoja aparece al empezar a hacer scroll, antes de que se listen los procesos. */
  const paperReveal = easeOut(seg(progress, 0, 0.14));
  const criticalReveal = easeOut(seg(progress, 0.8, 0.98));

  return (
    <div
      className={fill ? "relative h-full" : "relative mx-auto md:mx-0"}
      style={fill ? undefined : { maxWidth: 280 }}
    >
      <div
        style={{
          opacity: paperReveal,
          transform: `translateY(${(1 - paperReveal) * 18}px)`,
          willChange: "opacity, transform",
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 10,
          boxShadow: "0 14px 34px rgba(16, 20, 24, 0.14)",
          height: fill ? "100%" : undefined,
          minHeight: fill ? 360 : undefined,
          aspectRatio: fill ? undefined : "210 / 297",
          padding: fill ? "2.25rem 2.5rem" : "1.6rem 1.15rem",
          display: "flex",
          flexDirection: "column",
          gap: fill ? "0.1rem" : "0.65rem",
          justifyContent: fill ? "space-evenly" : undefined,
          overflow: "hidden",
        }}
      >
        {rows.map((n, i) => {
          const reveal = easeOut(seg(progress, 0.12 + i * 0.1, 0.3 + i * 0.1));
          const fromLeft = i % 2 === 0;
          const isCritical = i < CRITICAL_COUNT;
          const redTint = isCritical ? criticalReveal : 0;
          return (
            <div
              key={n}
              style={{
                opacity: reveal,
                transform: `translateX(${(1 - reveal) * (fromLeft ? -22 : 22)}px)`,
                willChange: "opacity, transform",
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "space-between",
                rowGap: "0.4rem",
                columnGap: "0.75rem",
                padding: fill ? "0.6rem 0.75rem" : "0.3rem 0.5rem",
                borderRadius: 6,
                borderBottom: "1px dashed var(--border)",
                background: `color-mix(in srgb, ${DARK_RED} ${Math.round(redTint * 14)}%, transparent)`,
              }}
            >
              <span className="flex items-center" style={{ gap: fill ? "0.9rem" : "0.55rem" }}>
                <span
                  style={{
                    fontFamily: JMONO,
                    fontSize: fill ? "1rem" : "0.7rem",
                    fontWeight: redTint > 0.4 ? 700 : 500,
                    color: redTint > 0.4 ? DARK_RED : "var(--muted)",
                    transition: "color 0.2s ease",
                  }}
                >
                  {String(n).padStart(2, "0")}
                </span>
                <span
                  style={{
                    fontFamily: GROTESK,
                    fontSize: fill ? "1.2rem" : "0.86rem",
                    fontWeight: redTint > 0.4 ? 700 : 600,
                    color: redTint > 0.4 ? DARK_RED : "var(--fg)",
                    transition: "color 0.2s ease",
                  }}
                >
                  {t(`v3.demo.proc${n}`)}
                </span>
              </span>

              <span className="flex items-center" style={{ gap: "0.45rem", flexWrap: "wrap", minWidth: 0 }}>
                <Tag text={t(`v3.demo.proc${n}Problem`)} tone="problem" critical={isCritical} />
                <span style={{ fontFamily: JMONO, fontSize: "0.8rem", fontWeight: 700, color: "var(--muted)" }}>+</span>
                <Tag text={t(`v3.demo.proc${n}Cause`)} tone="cause" critical={isCritical} />
              </span>
            </div>
          );
        })}
      </div>

      {/* Sello "¡Críticos!" junto a los tres primeros procesos */}
      <span
        aria-hidden={criticalReveal < 0.05}
        style={{
          position: "absolute",
          right: fill ? "1.75rem" : 8,
          top: fill ? "1.1rem" : 8,
          opacity: criticalReveal * paperReveal,
          transform: `translateX(${(1 - criticalReveal) * 14}px) rotate(-7deg) scale(${(0.85 + 0.15 * criticalReveal) * (fill ? 1.3 : 1)})`,
          willChange: "opacity, transform",
          fontFamily: JMONO,
          fontSize: fill ? "1rem" : "0.78rem",
          fontWeight: 700,
          color: DARK_RED,
          background: "var(--surface)",
          border: `1.5px solid ${DARK_RED}`,
          borderRadius: 6,
          padding: fill ? "0.45rem 0.8rem" : "0.3rem 0.55rem",
          boxShadow: "0 4px 12px rgba(127, 29, 29, 0.25)",
          whiteSpace: "nowrap",
        }}
      >
        {t("v3.demo.critical")}
      </span>
    </div>
  );
}
