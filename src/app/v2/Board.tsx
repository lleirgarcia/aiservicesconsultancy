"use client";

import { useI18n } from "@/i18n/LocaleContext";
import { useScrollProgress, seg, easeOut } from "./scrollProgress";

const GROTESK = "var(--font-space-grotesk), 'Space Grotesk', system-ui, sans-serif";
const JMONO = "var(--font-jetbrains), 'JetBrains Mono', ui-monospace, monospace";

const BLUE = "#0d6ef2";
const AMBER = "#f59e0b";
const VIOLET = "#8b5cf6";
const GREEN = "#16a34a";

/** Columnas del tablero y las fichas que cuelgan de cada una. */
const COLUMNS: { key: string; color: string; cards: string[] }[] = [
  { key: "c1", color: AMBER, cards: ["k1", "k2"] },
  { key: "c2", color: BLUE, cards: ["k3", "k4"] },
  { key: "c3", color: VIOLET, cards: ["k5", "k6"] },
  { key: "c4", color: GREEN, cards: ["k7", "k8"] },
];

/** Iconos de línea de las filas de la ficha. */
function RowIcon({ name }: { name: "sector" | "clock" | "euro" | "bulb" }) {
  const paths: Record<string, React.ReactNode> = {
    sector: (
      <>
        <path d="M3 21h18M5 21V8l6-4v17M19 21V11l-8-3" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    euro: (
      <>
        <rect x="2" y="6" width="20" height="12" rx="2" />
        <circle cx="12" cy="12" r="2.5" />
      </>
    ),
    bulb: (
      <>
        <path d="M9 18h6M10 21h4" />
        <path d="M12 3a6 6 0 0 0-3.5 10.9V15h7v-1.1A6 6 0 0 0 12 3z" />
      </>
    ),
  };
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0"
      aria-hidden
      style={{ color: "#b3bcc6", marginTop: 2 }}
    >
      {paths[name]}
    </svg>
  );
}

function Row({ icon, children }: { icon: "sector" | "clock" | "euro" | "bulb"; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <RowIcon name={icon} />
      <span style={{ fontSize: "0.83rem", color: "var(--muted-hi)", lineHeight: 1.4 }}>{children}</span>
    </div>
  );
}

function CardItem({ k, color }: { k: string; color: string }) {
  const { t } = useI18n();
  return (
    <article
      className="v3-hover"
      style={
        {
          background: `color-mix(in srgb, ${color} calc(7% + var(--ink) * 6%), var(--surface))`,
          border: `1px solid color-mix(in srgb, ${color} calc(24% + var(--ink) * 18%), var(--surface))`,
          "--hover-border": `color-mix(in srgb, ${color} 55%, var(--surface))`,
          borderRadius: 10,
          boxShadow: "0 1px 2px rgba(16,20,24,0.05)",
          padding: "0.85rem 0.9rem",
        } as React.CSSProperties
      }
    >
      <h4
        style={{
          fontFamily: GROTESK,
          fontSize: "0.92rem",
          fontWeight: 600,
          color: "var(--fg)",
          margin: "0 0 0.7rem",
          lineHeight: 1.3,
          textDecorationLine: "underline",
          textDecorationColor: "var(--border)",
          textUnderlineOffset: 3,
        }}
      >
        {t(`v3.board.${k}t`)}
      </h4>

      <div className="flex flex-col gap-1.5">
        <Row icon="sector">{t(`v3.board.${k}s`)}</Row>
        <Row icon="clock">
          <span style={{ color: "var(--muted)" }}>{t("v3.board.today")} </span>
          <span style={{ fontFamily: JMONO, fontWeight: 600 }}>{t(`v3.board.${k}h`)}</span>
        </Row>
        <Row icon="euro">
          <span style={{ color: "var(--muted)" }}>{t("v3.board.save")} </span>
          <span style={{ fontFamily: JMONO, fontWeight: 700, color: BLUE }}>{t(`v3.board.${k}e`)}</span>
        </Row>
        <Row icon="bulb">
          <span style={{ color: "var(--muted)" }}>{t(`v3.board.${k}n`)}</span>
        </Row>
      </div>

      <div
        className="flex items-center justify-between gap-2"
        style={{ marginTop: "0.85rem", paddingTop: "0.7rem", borderTop: `1px solid color-mix(in srgb, ${color} 22%, var(--surface))` }}
      >
        {/* Sobre el fondo teñido, la etiqueta va en blanco para que destaque */}
        <span
          style={{
            fontFamily: JMONO,
            fontSize: "0.66rem",
            fontWeight: 700,
            color,
            background: "var(--surface)",
            border: `1px solid color-mix(in srgb, ${color} 40%, #fff)`,
            borderRadius: 5,
            padding: "0.12rem 0.4rem",
          }}
        >
          {t("v3.board.tag")}
        </span>
        <span
          className="inline-flex items-center gap-1"
          style={{ fontFamily: JMONO, fontSize: "0.7rem", color: "var(--muted)" }}
          title={t("v3.board.build")}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 2" strokeLinecap="round" />
          </svg>
          {t(`v3.board.${k}b`)}
        </span>
      </div>
    </article>
  );
}

export default function Board() {
  const { t } = useI18n();
  const { ref, progress } = useScrollProgress<HTMLDivElement>();
  return (
    <div ref={ref}>
      {/* Entradilla a dos tonos */}
      <p
        style={{
          fontFamily: GROTESK,
          fontSize: "clamp(1.15rem, 2.2vw, 1.65rem)",
          lineHeight: 1.4,
          margin: "0 0 clamp(2rem, 5vh, 3rem)",
          maxWidth: "46ch",
        }}
      >
        <span style={{ color: "var(--fg)", fontWeight: 600 }}>{t("v3.board.lead1")}</span>{" "}
        <span style={{ color: "var(--muted)" }}>{t("v3.board.lead2")}</span>
      </p>

      {/* Tablero: se desplaza en horizontal, la última columna asoma */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-start">
        {COLUMNS.map(({ key, color, cards }, ci) => {
          const kc = easeOut(seg(progress, 0.02 + ci * 0.1, 0.4 + ci * 0.1));
          return (
          <section
            key={key}
            className="min-w-0"
            style={{
              opacity: kc,
              transform: `translateY(${(1 - kc) * 16}px)`,
              willChange: "opacity, transform",
              background: "var(--surface-2)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              padding: "0.7rem",
            }}
          >
            <header className="flex items-center gap-2" style={{ marginBottom: "0.85rem" }}>
              <span
                aria-hidden
                style={{ width: 9, height: 9, borderRadius: "50%", background: color, flexShrink: 0 }}
              />
              <h3
                style={{
                  fontFamily: GROTESK,
                  fontSize: "0.92rem",
                  fontWeight: 700,
                  color: "var(--fg)",
                  margin: 0,
                }}
              >
                {t(`v3.board.${key}`)}
              </h3>
              <span
                style={{
                  fontFamily: JMONO,
                  fontSize: "0.7rem",
                  color: "var(--muted)",
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: 5,
                  padding: "0 0.35rem",
                }}
              >
                {cards.length}
              </span>
            </header>

            <div className="flex flex-col gap-3">
              {cards.map((k, ri) => {
                const kr = easeOut(seg(progress, 0.06 + ci * 0.1 + ri * 0.06, 0.46 + ci * 0.1 + ri * 0.06));
                return (
                  <div
                    key={k}
                    style={{ opacity: kr, transform: `translateY(${(1 - kr) * 12}px)` }}
                  >
                    <CardItem k={k} color={color} />
                  </div>
                );
              })}
            </div>
          </section>
          );
        })}
      </div>

      {/* Una sola nota, en lugar de una etiqueta por ficha */}
      <p
        style={{
          fontSize: "0.78rem",
          color: "var(--muted)",
          margin: "1.25rem 0 0",
          maxWidth: "76ch",
          lineHeight: 1.55,
        }}
      >
        {t("v3.casos.note")}
      </p>
    </div>
  );
}
