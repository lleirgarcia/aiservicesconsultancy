"use client";

import { useI18n } from "@/i18n/LocaleContext";
import { seg, easeOut } from "./scrollProgress";

const GROTESK = "var(--font-space-grotesk), 'Space Grotesk', system-ui, sans-serif";
const JMONO = "var(--font-jetbrains), 'JetBrains Mono', ui-monospace, monospace";

const SLATE = "#475569";
const AMBER = "#f59e0b";
const RED = "#dc2626";
const BLUE = "#0d6ef2";

/** Los 4 pasos de la identificación: 3 señales que buscamos + la oportunidad que confirman. */
const STEPS: { num: string; color: string; icon: "pen" | "monitor" | "puzzle" | "bulb"; titleKey: string; bodyKey: string }[] = [
  { num: "1", color: SLATE, icon: "pen", titleKey: "v3.demo.ident1t", bodyKey: "v3.demo.ident1b" },
  { num: "2", color: AMBER, icon: "monitor", titleKey: "v3.demo.ident2t", bodyKey: "v3.demo.ident2b" },
  { num: "3", color: RED, icon: "puzzle", titleKey: "v3.demo.ident3t", bodyKey: "v3.demo.ident3b" },
  { num: "4", color: BLUE, icon: "bulb", titleKey: "v3.demo.ident4t", bodyKey: "v3.demo.ident4b" },
];

const ICONS: Record<string, React.ReactNode> = {
  pen: (
    <>
      <path d="M4 20h4l10-10a2.1 2.1 0 0 0-3-3L5 17z" />
      <path d="M13 6l3 3" />
    </>
  ),
  monitor: (
    <>
      <rect x="3" y="4" width="18" height="12" rx="2" />
      <path d="M8 20h8M12 16v4" />
    </>
  ),
  puzzle: (
    <>
      <path d="M4 7h4a1.5 1.5 0 0 1 3 0h4v4a1.5 1.5 0 0 1 0 3v4h-4a1.5 1.5 0 0 0-3 0H4v-4a1.5 1.5 0 0 0 0-3z" />
    </>
  ),
  bulb: (
    <>
      <path d="M9 18h6M10 21h4" />
      <path d="M12 3a6 6 0 0 0-3.5 10.9V15h7v-1.1A6 6 0 0 0 12 3z" />
    </>
  ),
};

function StepIcon({ name, color }: { name: string; color: string }) {
  return (
    <span
      aria-hidden
      className="flex items-center justify-center shrink-0"
      style={{ width: 34, height: 34, borderRadius: 9, background: `color-mix(in srgb, ${color} 14%, var(--surface))`, color }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        {ICONS[name]}
      </svg>
    </span>
  );
}

/** Flecha discontinua entre dos tarjetas (horizontal en escritorio, vertical en móvil). */
function Arrow({ draw }: { draw: number }) {
  return (
    <>
      <div className="hidden md:flex items-center justify-center" style={{ width: 26 }} aria-hidden>
        <svg width="26" height="14" viewBox="0 0 26 14" fill="none" style={{ overflow: "visible" }}>
          <path d="M1 7 H21" stroke="var(--border-strong, #cbd2da)" strokeWidth={1.5} pathLength={1} strokeDasharray={`${draw} 1`} strokeLinecap="round" />
          <path d="M16 2 L22 7 L16 12" stroke="var(--border-strong, #cbd2da)" strokeWidth={1.5} fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={draw > 0.92 ? 1 : 0} />
        </svg>
      </div>
      <div className="md:hidden flex justify-center" style={{ color: "var(--muted)", fontFamily: JMONO, opacity: draw > 0.5 ? 1 : 0 }} aria-hidden>
        ↓
      </div>
    </>
  );
}

function StepCard({ step, reveal }: { step: (typeof STEPS)[number]; reveal: number }) {
  const { t } = useI18n();
  return (
    <div
      className="min-w-0"
      style={{
        opacity: reveal,
        transform: `translateY(${(1 - reveal) * 14}px)`,
        willChange: "opacity, transform",
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        boxShadow: "0 1px 3px rgba(16, 20, 24, 0.07)",
        padding: "1.1rem 1.05rem 1.25rem",
        height: "100%",
      }}
    >
      <div style={{ marginBottom: "0.8rem" }}>
        <StepIcon name={step.icon} color={step.color} />
      </div>
      <h4
        style={{
          fontFamily: GROTESK,
          fontSize: "0.92rem",
          fontWeight: 700,
          color: "var(--fg)",
          margin: "0 0 0.4rem",
          lineHeight: 1.3,
        }}
      >
        {t(step.titleKey)}
      </h4>
      <p style={{ fontSize: "0.8rem", lineHeight: 1.55, color: "var(--muted)", margin: 0 }}>{t(step.bodyKey)}</p>
    </div>
  );
}

/** Gráfico animado: las 3 señales de un proceso costoso + la oportunidad que confirman, con scroll-reveal. */
function IdentifyCanvas({ progress }: { progress: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_26px_minmax(0,1fr)_26px_minmax(0,1fr)_26px_minmax(0,1fr)] gap-y-5 md:gap-y-0 items-stretch">
      {STEPS.map((step, i) => {
        const cardReveal = easeOut(seg(progress, i * 0.16, 0.32 + i * 0.16));
        const arrowDraw = easeOut(seg(progress, 0.28 + i * 0.16, 0.42 + i * 0.16));
        return (
          <div key={step.num} className="contents">
            <StepCard step={step} reveal={cardReveal} />
            {i < STEPS.length - 1 && <Arrow draw={arrowDraw} />}
          </div>
        );
      })}
    </div>
  );
}

/** Sección "Identificamos procesos costosos": entradilla + el gráfico animado. */
export default function IdentifyFlow({ progress }: { progress: number }) {
  const { t } = useI18n();
  return (
    <div>
      <p
        style={{
          fontFamily: GROTESK,
          fontSize: "clamp(1.15rem, 2.2vw, 1.65rem)",
          lineHeight: 1.4,
          margin: "0 0 clamp(2rem, 5vh, 3rem)",
          maxWidth: "46ch",
        }}
      >
        <span style={{ color: "var(--fg)", fontWeight: 600 }}>{t("v3.demo.identLead1")}</span>{" "}
        <span style={{ color: "var(--muted)" }}>{t("v3.demo.identLead2")}</span>
      </p>
      <IdentifyCanvas progress={progress} />
    </div>
  );
}
