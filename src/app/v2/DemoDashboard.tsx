"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useI18n } from "@/i18n/LocaleContext";
import type { Locale } from "@/i18n/dict";
import Board from "./Board";
import IdentifyFlow from "./IdentifyFlow";
import ProcessSheet from "./ProcessSheet";
import SolutionsFlow from "./SolutionsFlow";
import SystemDiagram from "./SystemDiagram";
import PinnedStep from "./PinnedStep";
import { seg, easeOut } from "./scrollProgress";

const GROTESK = "var(--font-space-grotesk), 'Space Grotesk', system-ui, sans-serif";
const JMONO = "var(--font-jetbrains), 'JetBrains Mono', ui-monospace, monospace";

const BLUE = "#0d6ef2";
const AMBER = "#f59e0b";
const SLATE = "#94a3b8";
const GREEN = "#16a34a";

const NUM_LOCALE: Record<Locale, string> = { es: "es-ES", ca: "ca-ES", en: "en-GB" };

/* ── Horas semanales de la tarea, repartidas por proceso ───────────────
   Los tres primeros meses son manuales; el sistema entra en el cuarto. */
const HOURS_BY_MONTH: readonly (readonly [number, number, number])[] = [
  [3.1, 1.0, 4.1],
  [2.9, 0.9, 4.0],
  [3.2, 1.1, 4.2],
  [0.9, 0.4, 1.1],
  [0.4, 0.2, 0.5],
  [0.3, 0.2, 0.5],
];
const SYSTEM_LIVE_AT = 3; // índice del primer mes con sistema

/* Coste acumulado del primer año: 6.800 €/año manual vs 850 €/año con sistema */
const COST_NO_SYSTEM_YEAR = 6800;
const COST_WITH_SYSTEM_YEAR = 850;

/** Tarjeta blanca del dashboard. */
function Card({
  title,
  subtitle,
  hint,
  children,
}: {
  title: string;
  subtitle?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="v3-hover"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 14,
        boxShadow: "0 1px 2px rgba(16, 20, 24, 0.04)",
        padding: "1.25rem 1.35rem 1.4rem",
      }}
    >
      <div className="flex items-baseline gap-2">
        <h3
          style={{
            fontFamily: GROTESK,
            fontSize: "1rem",
            fontWeight: 700,
            color: "var(--fg)",
            margin: 0,
          }}
        >
          {title}
        </h3>
        {hint && (
          <span
            title={hint}
            aria-label={hint}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 15,
              height: 15,
              borderRadius: "50%",
              border: "1px solid var(--border)",
              color: "var(--muted)",
              fontSize: 10,
              fontWeight: 700,
              cursor: "help",
              flexShrink: 0,
            }}
          >
            i
          </span>
        )}
      </div>
      {subtitle && (
        <p style={{ fontSize: "0.8rem", color: "var(--muted)", margin: "0.3rem 0 0" }}>{subtitle}</p>
      )}
      <div style={{ marginTop: "1.1rem" }}>{children}</div>
    </div>
  );
}

/** Leyenda con puntos de color. */
function Legend({ items }: { items: { color: string; label: string; dashed?: boolean }[] }) {
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
      {items.map(({ color, label, dashed }) => (
        <span key={label} className="inline-flex items-center gap-2" style={{ fontSize: "0.8rem", color: "var(--muted-hi)" }}>
          {dashed ? (
            <span aria-hidden style={{ width: 14, height: 0, borderTop: `2px dashed ${color}`, display: "inline-block" }} />
          ) : (
            <span aria-hidden style={{ width: 9, height: 9, borderRadius: "50%", background: color, display: "inline-block" }} />
          )}
          {label}
        </span>
      ))}
    </div>
  );
}

/** Barras apiladas: horas semanales por mes, segmentadas por proceso. */
function HoursChart({ progress }: { progress: number }) {
  const { t } = useI18n();
  const months = t("v3.demo.months").split(",");

  const W = 600;
  const H = 258;
  const X0 = 46;
  const X1 = 588;
  const Y0 = 26;
  const Y1 = 200;
  const MAX = 9;

  const band = (X1 - X0) / HOURS_BY_MONTH.length;
  const barW = Math.min(48, band * 0.52);
  const y = (v: number) => Y1 - (v / MAX) * (Y1 - Y0);
  const dividerX = X0 + SYSTEM_LIVE_AT * band;

  return (
    <div>
      <Legend
        items={[
          { color: BLUE, label: t("v3.demo.lg1") },
          { color: AMBER, label: t("v3.demo.lg2") },
          { color: SLATE, label: t("v3.demo.lg3") },
        ]}
      />
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        role="img"
        aria-label={`${t("v3.demo.ch1t")} — ${t("v3.demo.ch1s")}`}
        style={{ display: "block", height: "auto", marginTop: "1rem", overflow: "visible" }}
      >
        {/* rejilla y eje Y */}
        {[0, 3, 6, 9].map((v) => (
          <g key={v}>
            <line
              x1={X0}
              x2={X1}
              y1={y(v)}
              y2={y(v)}
              stroke="var(--border)"
              strokeWidth={1}
              strokeDasharray={v === 0 ? undefined : "3 4"}
            />
            <text x={X0 - 10} y={y(v) + 4} textAnchor="end" style={{ fontFamily: JMONO, fontSize: 11, fill: "var(--muted)" }}>
              {v}
            </text>
          </g>
        ))}
        {/* La unidad, girada junto al eje: es donde queda hueco y no roba
            altura al gráfico. */}
        <text
          x={X0 - 34}
          y={(Y0 + Y1) / 2}
          textAnchor="middle"
          transform={`rotate(-90 ${X0 - 34} ${(Y0 + Y1) / 2})`}
          style={{ fontFamily: JMONO, fontSize: 10, fill: "var(--muted)" }}
        >
          {t("v3.demo.ch1s")}
        </text>

        {/* marca de entrada del sistema */}
        <g opacity={seg(progress, 0.42, 0.62)}>
          <line x1={dividerX} x2={dividerX} y1={Y0 - 4} y2={Y1} stroke={GREEN} strokeWidth={1} strokeDasharray="4 4" />
          <text x={dividerX + 7} y={Y0 - 6} style={{ fontFamily: JMONO, fontSize: 11, fill: GREEN, fontWeight: 700 }}>
            ↓ {t("v3.demo.live")}
          </text>
        </g>

        {/* barras */}
        {HOURS_BY_MONTH.map((bars, i) => {
          const cx = X0 + band * i + band / 2;
          const x = cx - barW / 2;
          const total = bars[0] + bars[1] + bars[2];
          const k = easeOut(seg(progress, 0.04 + i * 0.085, 0.42 + i * 0.085));
          const top = Y1 - (Y1 - y(total)) * k;
          const clipId = `barclip-${i}`;
          let cursor = Y1;
          return (
            <g key={i}>
              <clipPath id={clipId}>
                <rect x={x} y={top} width={barW} height={Y1 - top} rx={4} />
              </clipPath>
              <g clipPath={`url(#${clipId})`}>
                {[
                  { v: bars[2], c: SLATE },
                  { v: bars[1], c: AMBER },
                  { v: bars[0], c: BLUE },
                ].map(({ v, c }, j) => {
                  const h = (v / MAX) * (Y1 - Y0);
                  cursor -= h;
                  return <rect key={j} x={x} y={cursor} width={barW} height={h} fill={c} />;
                })}
              </g>
              <text
                x={cx}
                y={top - 8}
                textAnchor="middle"
                opacity={k}
                style={{
                  fontFamily: JMONO,
                  fontSize: 11,
                  fontWeight: 700,
                  fill: i >= SYSTEM_LIVE_AT ? BLUE : "var(--muted-hi)",
                }}
              >
                {total.toFixed(1).replace(".", ",")}
              </text>
              <text
                x={cx}
                y={Y1 + 20}
                textAnchor="middle"
                style={{ fontFamily: JMONO, fontSize: 11, fill: "var(--muted)" }}
              >
                {months[i]}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/** Líneas de coste acumulado: sin sistema vs con sistema, con el hueco del ahorro. */
function CostChart({ progress }: { progress: number }) {
  const { t, locale } = useI18n();
  const nf = useMemo(
    () => new Intl.NumberFormat(NUM_LOCALE[locale], { maximumFractionDigits: 0 }),
    [locale]
  );

  const W = 600;
  const H = 236;
  const X0 = 58;
  const X1 = 566;
  const Y0 = 22;
  const Y1 = 186;
  const MAX = 7000;

  const x = (m: number) => X0 + (m / 12) * (X1 - X0);
  const y = (v: number) => Y1 - (v / MAX) * (Y1 - Y0);

  const months = Array.from({ length: 13 }, (_, m) => m);
  const noSys = months.map((m) => (COST_NO_SYSTEM_YEAR / 12) * m);
  const withSys = months.map((m) => (COST_WITH_SYSTEM_YEAR / 12) * m);

  const line = (vals: number[]) => vals.map((v, m) => `${m === 0 ? "M" : "L"}${x(m)} ${y(v)}`).join(" ");
  const area = (vals: number[]) => `${line(vals)} L${x(12)} ${Y1} L${x(0)} ${Y1} Z`;

  const gapTop = y(noSys[12]);
  const gapBottom = y(withSys[12]);

  const drawNo = easeOut(seg(progress, 0.05, 0.45));
  const drawYes = easeOut(seg(progress, 0.16, 0.58));
  const areaIn = seg(progress, 0.35, 0.7);
  const gapIn = seg(progress, 0.55, 0.78);

  return (
    <div>
      <Legend
        items={[
          { color: SLATE, label: t("v3.demo.lgNo"), dashed: true },
          { color: BLUE, label: t("v3.demo.lgYes") },
        ]}
      />
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        role="img"
        aria-label={`${t("v3.demo.ch2t")} — ${t("v3.demo.ch2s")}`}
        style={{ display: "block", height: "auto", marginTop: "1rem", overflow: "visible" }}
      >
        {[0, 3500, 7000].map((v) => (
          <g key={v}>
            <line
              x1={X0}
              x2={X1}
              y1={y(v)}
              y2={y(v)}
              stroke="var(--border)"
              strokeWidth={1}
              strokeDasharray={v === 0 ? undefined : "3 4"}
            />
            <text x={X0 - 10} y={y(v) + 4} textAnchor="end" style={{ fontFamily: JMONO, fontSize: 11, fill: "var(--muted)" }}>
              {nf.format(v)}
            </text>
          </g>
        ))}
        <text x={X0 - 10} y={Y0 - 8} textAnchor="end" style={{ fontFamily: JMONO, fontSize: 10, fill: "var(--muted)" }}>
          €
        </text>

        {/* La unidad va en la última marca, no suelta fuera del gráfico. */}
        {[3, 6, 9, 12].map((m) => (
          <text
            key={m}
            x={m === 12 ? x(m) + 8 : x(m)}
            y={Y1 + 20}
            textAnchor={m === 12 ? "end" : "middle"}
            style={{ fontFamily: JMONO, fontSize: 11, fill: "var(--muted)" }}
          >
            {m === 12 ? `${m} ${t("v3.demo.xUnit")}` : m}
          </text>
        ))}

        {/* el recorte avanza de izquierda a derecha con el scroll */}
        <clipPath id="clip-no">
          <rect x={X0 - 4} y={0} width={(X1 - X0 + 8) * drawNo} height={H} />
        </clipPath>
        <clipPath id="clip-yes">
          <rect x={X0 - 4} y={0} width={(X1 - X0 + 8) * drawYes} height={H} />
        </clipPath>
        <g clipPath="url(#clip-no)">
          <path d={area(noSys)} fill={SLATE} opacity={0.1 * areaIn} />
          <path d={line(noSys)} fill="none" stroke={SLATE} strokeWidth={2} strokeDasharray="5 4" />
        </g>
        <g clipPath="url(#clip-yes)">
          <path d={area(withSys)} fill={BLUE} opacity={0.12 * areaIn} />
          <path d={line(withSys)} fill="none" stroke={BLUE} strokeWidth={2.5} />
        </g>
        <circle cx={x(12)} cy={gapTop} r={3.5} fill={SLATE} opacity={drawNo} />
        <circle cx={x(12)} cy={gapBottom} r={3.5} fill={BLUE} opacity={drawYes} />

        {/* corchete del ahorro */}
        <g opacity={gapIn}>
          <line x1={X1 + 14} x2={X1 + 14} y1={gapTop} y2={gapBottom} stroke={GREEN} strokeWidth={1.5} />
          <line x1={X1 + 9} x2={X1 + 19} y1={gapTop} y2={gapTop} stroke={GREEN} strokeWidth={1.5} />
          <line x1={X1 + 9} x2={X1 + 19} y1={gapBottom} y2={gapBottom} stroke={GREEN} strokeWidth={1.5} />
          <text
            x={X1 + 8}
            y={(gapTop + gapBottom) / 2 - 6}
            textAnchor="end"
            style={{ fontFamily: JMONO, fontSize: 12, fontWeight: 700, fill: GREEN }}
          >
            {t("v3.demo.gap")}
          </text>
        </g>
      </svg>
    </div>
  );
}



const STEPS = ["stI", "st0", "st1", "st2", "stSistema", "stSeg", "st3"] as const;

const HEADER_OFFSET_PX = 76;
const SCROLL_MS = 420;

function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * Al hacer clic en el nav: salta al instante al principio de esa sección (sin
 * recorrer en scroll las secciones intermedias) y, desde ahí, anima solo su
 * recorrido fijado hasta el final, donde su animación interna llega a 1 y
 * suelta el scroll a la siguiente. Recalcula el final en cada frame (en vez
 * de fijarlo una sola vez al principio) para que cualquier pequeño reajuste
 * de layout durante la animación no produzca un salto o un frenazo a medio
 * camino. Fuerza `behavior: "instant"` en cada paso: el CSS global tiene
 * `scroll-behavior: smooth`, y si no se anula aquí compite con nuestro propio
 * easing. Avanza por tiempo delta CAPADO por frame (no por tiempo absoluto
 * transcurrido): si una escena hace un trabajo pesado en el hilo principal
 * (p. ej. el cohete 3D) y un frame tarda mucho más de lo normal, el progreso
 * de esta animación solo avanza lo que le corresponde a ese frame capado, en
 * vez de saltar de golpe al intentar "recuperar" todo el tiempo perdido.
 */
function playSection(el: HTMLElement) {
  const vh = window.innerHeight || 1;
  const rect0 = el.getBoundingClientRect();
  const yStart = rect0.top + window.scrollY - HEADER_OFFSET_PX;
  const pinnedRangeNow = () => Math.max(0, el.getBoundingClientRect().height - vh);
  const estPinnedRange = pinnedRangeNow();

  window.scrollTo({ top: yStart, behavior: "instant" });
  if (estPinnedRange < 1) return;

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    window.scrollTo({ top: yStart + pinnedRangeNow(), behavior: "instant" });
    return;
  }

  const durationMs = Math.min(2600, Math.max(SCROLL_MS, estPinnedRange * 0.9));
  const MAX_FRAME_MS = 80;
  let u = 0;
  let last = performance.now();
  const tick = (now: number) => {
    const dt = Math.min(now - last, MAX_FRAME_MS);
    last = now;
    u = Math.min(1, u + dt / durationMs);
    window.scrollTo({ top: yStart + easeInOutCubic(u) * pinnedRangeNow(), behavior: "instant" });
    if (u < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

export default function DemoDashboard() {
  const { t } = useI18n();
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const els = refs.current.filter(Boolean) as HTMLDivElement[];
    if (els.length === 0) return;
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) {
          const i = els.indexOf(visible.target as HTMLDivElement);
          if (i >= 0) setActive(i);
        }
      },
      { rootMargin: "-20% 0px -55% 0px", threshold: 0 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-[190px_minmax(0,1fr)] gap-x-10 gap-y-6">
      {/* Navegación de pasos */}
      <nav className="hidden md:block">
        <ol className="sticky flex flex-col gap-4" style={{ top: 96, margin: 0, padding: 0, listStyle: "none" }}>
          {STEPS.map((s, i) => {
            const on = i === active;
            return (
              <li key={s}>
                <button
                  type="button"
                  onClick={() => {
                    const el = refs.current[i];
                    if (el) playSection(el);
                  }}
                  className="v3-step"
                  style={{
                    display: "block",
                    width: "100%",
                    textAlign: "left",
                    background: "transparent",
                    border: "none",
                    borderLeft: `2px solid ${on ? BLUE : "transparent"}`,
                    padding: "0.1rem 0 0.1rem 0.85rem",
                    cursor: "pointer",
                    fontFamily: GROTESK,
                    fontSize: "1.02rem",
                    fontWeight: on ? 700 : 500,
                    color: on ? "var(--fg)" : "#b7bec6",
                    transition: "color 0.2s ease, border-color 0.2s ease",
                  }}
                >
                  {t(`v3.demo.${s}`)}
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      {/* Paneles: cada paso se queda fijo en pantalla mientras su scroll interno anima su contenido */}
      <div className="flex flex-col min-w-0">
        <PinnedStep registerRef={(el) => { refs.current[0] = el; }}>
          {(progress) => <IdentifyFlow progress={progress} />}
        </PinnedStep>

        {/* "Proponemos": entradilla arriba, hoja de procesos grande debajo; el tablero vive ahora en "Seguimiento" */}
        <PinnedStep registerRef={(el) => { refs.current[1] = el; }} fill>
          {(progress) => (
            <div className="flex flex-col h-full gap-6 md:gap-8">
              <p
                style={{
                  fontFamily: GROTESK,
                  fontSize: "clamp(1.15rem, 2.2vw, 1.65rem)",
                  lineHeight: 1.4,
                  margin: 0,
                  maxWidth: "60ch",
                  flexShrink: 0,
                }}
              >
                <span style={{ color: "var(--fg)", fontWeight: 600 }}>{t("v3.demo.proponemosLead1")}</span>{" "}
                <span style={{ color: "var(--muted)" }}>{t("v3.demo.proponemosLead2")}</span>
              </p>
              <div className="flex-1 min-h-0">
                <ProcessSheet progress={progress} fill />
              </div>
            </div>
          )}
        </PinnedStep>

        <PinnedStep registerRef={(el) => { refs.current[2] = el; }}>
          {(progress) => (
            <div>
              {/* Entradilla del ejemplo detallado */}
              <p
                style={{
                  fontFamily: GROTESK,
                  fontSize: "clamp(1.1rem, 2vw, 1.5rem)",
                  lineHeight: 1.4,
                  margin: "0 0 clamp(1.5rem, 4vh, 2.5rem)",
                  maxWidth: "46ch",
                }}
              >
                <span style={{ color: "var(--fg)", fontWeight: 600 }}>{t("v3.demo.lead1")}</span>{" "}
                <span style={{ color: "var(--muted)" }}>{t("v3.demo.lead2")}</span>
              </p>
              <Card title={t("v3.demo.ch1t")} subtitle={t("v3.demo.task")} hint={t("v3.demo.hint1")}>
                <HoursChart progress={progress} />
              </Card>
            </div>
          )}
        </PinnedStep>

        {/* "Soluciones": cómo trabajamos, de principio a fin — 5 escenas secuenciales */}
        <PinnedStep registerRef={(el) => { refs.current[3] = el; }} fill tall>
          {(progress) => <SolutionsFlow progress={progress} />}
        </PinnedStep>

        {/* "Sistema": todo converge en una única aplicación */}
        <PinnedStep registerRef={(el) => { refs.current[4] = el; }}>
          {(progress) => <SystemDiagram progress={progress} />}
        </PinnedStep>

        {/* "Seguimiento": el tablero de ejemplos, ahora como panel de evidencia */}
        <PinnedStep registerRef={(el) => { refs.current[5] = el; }}>
          {(progress) => <Board progress={progress} />}
        </PinnedStep>

        <PinnedStep registerRef={(el) => { refs.current[6] = el; }}>
          {(progress) => (
            <Card title={t("v3.demo.ch2t")} subtitle={t("v3.demo.ch2s")} hint={t("v3.demo.hint2")}>
              <CostChart progress={progress} />
              <div className="flex flex-wrap gap-2" style={{ marginTop: "1.5rem" }}>
                {(["d1", "d2", "d3"] as const).map((d) => (
                  <span
                    key={d}
                    style={{
                      fontFamily: JMONO,
                      fontSize: "0.78rem",
                      fontWeight: 700,
                      color: BLUE,
                      background: "rgba(13, 110, 242, 0.08)",
                      border: "1px solid rgba(13, 110, 242, 0.28)",
                      borderRadius: 999,
                      padding: "0.32rem 0.7rem",
                    }}
                  >
                    {t(`v3.demo.${d}`)}
                  </span>
                ))}
              </div>
            </Card>
          )}
        </PinnedStep>
      </div>
    </div>
  );
}
