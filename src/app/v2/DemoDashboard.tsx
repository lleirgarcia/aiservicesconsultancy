"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useI18n } from "@/i18n/LocaleContext";
import type { Locale } from "@/i18n/dict";
import Board from "./Board";
import { useScrollProgress, seg, easeOut } from "./scrollProgress";

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
function HoursChart() {
  const { t } = useI18n();
  const months = t("v3.demo.months").split(",");
  const { ref, progress } = useScrollProgress<HTMLDivElement>();

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
    <div ref={ref}>
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
function CostChart() {
  const { t, locale } = useI18n();
  /* Es la última tarjeta de la página: el recorrido disponible es corto,
     así que su animación se completa antes que la de las demás. */
  const { ref, progress } = useScrollProgress<HTMLDivElement>({ start: 0.95, end: 0.45 });
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
    <div ref={ref}>
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


/** Iconos de los nodos (trazo, heredan color del chip). */
const ICONS: Record<string, React.ReactNode> = {
  copy: (
    <>
      <rect x="9" y="9" width="10" height="10" rx="2" />
      <path d="M5 15V5a2 2 0 0 1 2-2h8" />
    </>
  ),
  table: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M3 10h18M9 10v10" />
    </>
  ),
  doc: (
    <>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5" />
    </>
  ),
  gear: (
    <>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.2 2.2M16.9 16.9l2.2 2.2M19.1 4.9l-2.2 2.2M7.1 16.9l-2.2 2.2" />
    </>
  ),
  check: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12.5l2.6 2.6L16 9.5" />
    </>
  ),
};

function NodeIcon({ name, color, bg }: { name: string; color: string; bg: string }) {
  return (
    <span
      aria-hidden
      className="flex items-center justify-center shrink-0"
      style={{ width: 32, height: 32, borderRadius: 8, background: bg, color }}
    >
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        {ICONS[name]}
      </svg>
    </span>
  );
}

/** Nodo del canvas de flujo. */
function Node({
  title,
  sub,
  badge,
  badgeTone = "manual",
  icon,
  iconColor,
  iconBg,
  tone = "plain",
}: {
  title: string;
  sub: string;
  badge: string;
  badgeTone?: "manual" | "auto";
  icon: string;
  iconColor: string;
  iconBg: string;
  tone?: "plain" | "system" | "save";
}) {
  const border =
    tone === "plain" ? "1px solid var(--border)" : `1.5px solid ${tone === "save" ? GREEN : BLUE}`;
  const badgeBg = badgeTone === "auto" ? "#dcfce7" : "#fef3c7";
  const badgeFg = badgeTone === "auto" ? GREEN : "#b45309";
  return (
    <div className="relative">
      {tone === "system" && <span className="v3-pulse" aria-hidden />}
      <span
        style={{
          position: "absolute",
          top: -13,
          right: 10,
          border: `1px solid ${badgeTone === "auto" ? "#bbf7d0" : "#fde68a"}`,
          background: badgeBg,
          color: badgeFg,
          fontFamily: JMONO,
          fontSize: "0.66rem",
          fontWeight: 700,
          borderRadius: 6,
          padding: "0.15rem 0.45rem",
          whiteSpace: "nowrap",
        }}
      >
        {badge}
      </span>
      <div
        className="flex items-center gap-3"
        style={{
          background: "var(--surface)",
          border,
          borderRadius: 12,
          boxShadow: "0 1px 3px rgba(16, 20, 24, 0.07)",
          padding: "0.7rem 0.85rem",
          height: 76,
        }}
      >
        <NodeIcon name={icon} color={iconColor} bg={iconBg} />
        <span className="min-w-0">
          <span
            className="block"
            style={{ fontFamily: GROTESK, fontSize: "0.92rem", fontWeight: 600, color: "var(--fg)", lineHeight: 1.25 }}
          >
            {title}
          </span>
          <span className="block" style={{ fontSize: "0.78rem", color: "var(--muted)" }}>
            {sub}
          </span>
        </span>
      </div>
    </div>
  );
}

/* Geometría del canvas: 3 nodos de 76px con 22px de hueco. */
const NODE_H = 76;
const NODE_GAP = 22;
const COL_H = NODE_H * 3 + NODE_GAP * 2;
const Y_TOP = NODE_H / 2;
const Y_MID = COL_H / 2;
const Y_BOT = COL_H - NODE_H / 2;

/** Conectores que unen los 3 procesos en el sistema (solo escritorio). */
function MergeConnector({ draw }: { draw: number }) {
  const w = 76;
  return (
    <svg width="100%" height={COL_H} viewBox={`0 0 ${w} ${COL_H}`} fill="none" aria-hidden style={{ overflow: "visible" }}>
      {[
        `M2 ${Y_TOP} H${w / 2 - 12} Q${w / 2} ${Y_TOP} ${w / 2} ${Y_TOP + 12} V${Y_MID - 12} Q${w / 2} ${Y_MID} ${w / 2 + 12} ${Y_MID} H${w - 2}`,
        `M2 ${Y_MID} H${w - 2}`,
        `M2 ${Y_BOT} H${w / 2 - 12} Q${w / 2} ${Y_BOT} ${w / 2} ${Y_BOT - 12} V${Y_MID + 12} Q${w / 2} ${Y_MID} ${w / 2 + 12} ${Y_MID} H${w - 2}`,
      ].map((d, i) => (
        <path
          key={i}
          d={d}
          stroke={BLUE}
          strokeWidth={1.5}
          opacity={0.5}
          pathLength={1}
          strokeDasharray={`${draw} 1`}
        />
      ))}
      {[Y_TOP, Y_MID, Y_BOT].map((cy) => (
        <circle key={cy} cx={2} cy={cy} r={3} fill={BLUE} opacity={draw > 0 ? 1 : 0} />
      ))}
      <circle cx={w - 2} cy={Y_MID} r={3} fill={BLUE} opacity={draw > 0.95 ? 1 : 0} />
    </svg>
  );
}

/** Conector recto del sistema al resultado (solo escritorio). */
function StraightConnector({ draw }: { draw: number }) {
  return (
    <svg width="100%" height={20} viewBox="0 0 76 20" fill="none" aria-hidden style={{ overflow: "visible" }}>
      <path d="M2 10 H74" stroke={GREEN} strokeWidth={1.5} opacity={0.6} pathLength={1} strokeDasharray={`${draw} 1`} />
      <circle cx={2} cy={10} r={3} fill={GREEN} opacity={draw > 0 ? 1 : 0} />
      <circle cx={74} cy={10} r={3} fill={GREEN} opacity={draw > 0.95 ? 1 : 0} />
    </svg>
  );
}

/** Canvas de flujo con fondo de puntos. */
function FlowCanvas() {
  const { t } = useI18n();
  const { ref, progress } = useScrollProgress<HTMLDivElement>();

  /** Cada pieza entra en su tramo del recorrido. */
  const appear = (a: number, b: number) => {
    const k = easeOut(seg(progress, a, b));
    return { opacity: k, transform: `translateY(${(1 - k) * 14}px)`, willChange: "opacity, transform" };
  };

  return (
    <div
      ref={ref}
      style={{
        borderRadius: 12,
        border: "1px solid var(--border)",
        background:
          "radial-gradient(circle, color-mix(in srgb, #c9d6ff calc(var(--ink) * 100%), rgba(16,20,24,0.13)) 1px, transparent 1px) 0 0 / 18px 18px, var(--surface-2)",
        padding: "1.6rem 1.25rem",
      }}
    >
      <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_76px_minmax(0,1fr)_76px_minmax(0,0.85fr)] gap-y-6 md:gap-y-0 items-center">
        <div className="flex flex-col" style={{ gap: NODE_GAP }}>
          <div style={appear(0, 0.16)}>
          <Node icon="copy" iconColor={BLUE} iconBg="rgba(13,110,242,0.1)" title={t("v3.demo.p1t")} sub={t("v3.demo.p1s")} badge={t("v3.demo.bManual")} />
          </div>
          <div style={appear(0.06, 0.22)}>
          <Node icon="table" iconColor="#b45309" iconBg="rgba(245,158,11,0.14)" title={t("v3.demo.p2t")} sub={t("v3.demo.p2s")} badge={t("v3.demo.bManual")} />
          </div>
          <div style={appear(0.12, 0.28)}>
          <Node icon="doc" iconColor="#64748b" iconBg="rgba(148,163,184,0.18)" title={t("v3.demo.p3t")} sub={t("v3.demo.p3s")} badge={t("v3.demo.bManual")} />
          </div>
        </div>

        <div className="hidden md:block"><MergeConnector draw={easeOut(seg(progress, 0.28, 0.58))} /></div>
        <div className="md:hidden text-center" style={{ color: BLUE, fontFamily: JMONO }}>↓</div>

        <div style={appear(0.54, 0.72)}>
        <Node
          icon="gear"
          iconColor={BLUE}
          iconBg="rgba(13,110,242,0.12)"
          tone="system"
          title={t("v3.demo.sys")}
          sub={t("v3.demo.sysSub")}
          badge={t("v3.demo.bAuto")}
          badgeTone="auto"
        />
        </div>

        <div className="hidden md:block"><StraightConnector draw={easeOut(seg(progress, 0.7, 0.86))} /></div>
        <div className="md:hidden text-center" style={{ color: GREEN, fontFamily: JMONO }}>↓</div>

        <div style={appear(0.82, 1)}>
        <Node
          icon="check"
          iconColor={GREEN}
          iconBg="rgba(22,163,74,0.12)"
          tone="save"
          title={t("v3.demo.save")}
          sub={t("v3.demo.saveSub")}
          badge={t("v3.demo.bResult")}
          badgeTone="auto"
        />
        </div>
      </div>
    </div>
  );
}

const STEPS = ["st0", "st1", "st2", "st3"] as const;

const HEADER_OFFSET_PX = 76;
const SCROLL_MS = 420;

function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/** Desplazamiento suave hasta un elemento; respeta reduced-motion. */
function scrollToEl(el: HTMLElement) {
  const yTarget = el.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET_PX;
  const y0 = window.scrollY;
  const delta = yTarget - y0;
  if (Math.abs(delta) < 1) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    window.scrollTo(0, yTarget);
    return;
  }
  const t0 = performance.now();
  const tick = (now: number) => {
    const u = Math.min(1, (now - t0) / SCROLL_MS);
    window.scrollTo(0, y0 + delta * easeInOutCubic(u));
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
                    if (el) scrollToEl(el);
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

      {/* Paneles */}
      <div className="flex flex-col gap-5 min-w-0">
        <div ref={(el) => { refs.current[0] = el; }}>
          <Board />
        </div>

        {/* Entradilla del ejemplo detallado */}
        <p
          style={{
            fontFamily: GROTESK,
            fontSize: "clamp(1.1rem, 2vw, 1.5rem)",
            lineHeight: 1.4,
            margin: "clamp(1.5rem, 4vh, 2.5rem) 0 0",
            maxWidth: "46ch",
          }}
        >
          <span style={{ color: "var(--fg)", fontWeight: 600 }}>{t("v3.demo.lead1")}</span>{" "}
          <span style={{ color: "var(--muted)" }}>{t("v3.demo.lead2")}</span>
        </p>

        <div ref={(el) => { refs.current[1] = el; }}>
          <Card title={t("v3.demo.ch1t")} subtitle={t("v3.demo.task")} hint={t("v3.demo.hint1")}>
            <HoursChart />
          </Card>
        </div>

        <div ref={(el) => { refs.current[2] = el; }}>
          <Card title={t("v3.demo.flowT")} subtitle={t("v3.demo.flowS")}>
            <FlowCanvas />
          </Card>
        </div>

        {/* Un respiro extra entre el sistema y su resultado */}
        <div ref={(el) => { refs.current[3] = el; }} style={{ marginTop: "clamp(1.25rem, 3.5vh, 2.75rem)" }}>
          <Card title={t("v3.demo.ch2t")} subtitle={t("v3.demo.ch2s")} hint={t("v3.demo.hint2")}>
            <CostChart />
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
        </div>
      </div>
    </div>
  );
}
