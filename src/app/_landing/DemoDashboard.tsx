"use client";

import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/i18n/LocaleContext";
import Board from "./Board";
import IdentifyFlow from "./IdentifyFlow";
import ProcessSheet from "./ProcessSheet";
import SolutionsFlow from "./SolutionsFlow";
import SystemDiagram from "./SystemDiagram";
import PinnedStep from "./PinnedStep";
import ScrollHint from "./ScrollHint";
import { seg, easeOut } from "./scrollProgress";

const GROTESK = "var(--font-space-grotesk), 'Space Grotesk', system-ui, sans-serif";
const JMONO = "var(--font-jetbrains), 'JetBrains Mono', ui-monospace, monospace";

const BLUE = "#0d6ef2";
const AMBER = "#f59e0b";
const SLATE = "#94a3b8";
const GREEN = "#16a34a";

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

const STEPS = ["stI", "st0", "st2", "stSistema", "stSeg", "st3"] as const;

const HEADER_OFFSET_PX = 76;

/**
 * Al hacer clic en el nav: salta directamente al principio de esa sección
 * (sin recorrer en scroll las secciones intermedias) y la deja ahí — el
 * usuario sigue el recorrido interno a su ritmo, con su propio scroll, en
 * vez de verlo reproducirse solo hasta el final. `behavior: "instant"`
 * evita el salto: el CSS global tiene `scroll-behavior: smooth`, y un
 * scroll programático con esa animación en curso compite con el scroll real
 * del usuario si este sigue moviendo la rueda justo después (el salto se ve
 * entonces a tirones, o algún elemento que depende de la posición de scroll
 * -como el aviso de "sigue haciendo scroll"- parpadea a medio camino).
 */
function playSection(el: HTMLElement) {
  const yStart = el.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET_PX;
  window.scrollTo({ top: yStart, behavior: "instant" });
}

export default function DemoDashboard() {
  const { t } = useI18n();
  const [active, setActive] = useState(0);
  const [inDashboard, setInDashboard] = useState(false);
  const refs = useRef<(HTMLDivElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement | null>(null);

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

  // Aviso "sigue haciendo scroll": visible mientras cualquier parte del stepper
  // (de Identificamos a Resultado) esté en pantalla, en cualquier dirección.
  // Cada vez que ENTRA (pasa de fuera a dentro) cuenta como un pase; a partir
  // del segundo pase se muestra en su versión reducida, para que estorbe menos
  // una vez que el usuario ya sabe de qué va.
  const passesRef = useRef(0);
  const wasInDashboardRef = useRef(false);
  const [passCount, setPassCount] = useState(0);
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        const now = entry.isIntersecting;
        if (now && !wasInDashboardRef.current) {
          passesRef.current += 1;
          setPassCount(passesRef.current);
        }
        wasInDashboardRef.current = now;
        setInDashboard(now);
      },
      { threshold: 0 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // En su versión compacta, el aviso se alinea con el borde izquierdo de la
  // columna del nav (mismo eje que "Identificamos"/"Proponemos"...), no con
  // el borde de la ventana — para que parezca parte del mismo bloque, no un
  // intruso.
  const [navLeft, setNavLeft] = useState<number | null>(null);
  useEffect(() => {
    const measure = () => {
      if (containerRef.current) setNavLeft(containerRef.current.getBoundingClientRect().left);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  return (
    <div ref={containerRef} className="grid grid-cols-1 md:grid-cols-[190px_minmax(0,1fr)] gap-x-10 gap-y-6">
      <ScrollHint visible={inDashboard} compact={passCount >= 2} compactLeft={navLeft} />
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

        {/* "Soluciones": cómo trabajamos, de principio a fin — 5 escenas secuenciales */}
        <PinnedStep registerRef={(el) => { refs.current[2] = el; }} fill tall>
          {(progress) => <SolutionsFlow progress={progress} />}
        </PinnedStep>

        {/* "Sistema": todo converge en una única aplicación */}
        <PinnedStep registerRef={(el) => { refs.current[3] = el; }}>
          {(progress) => <SystemDiagram progress={progress} />}
        </PinnedStep>

        {/* "Seguimiento": el tablero de ejemplos, ahora como panel de evidencia */}
        <PinnedStep registerRef={(el) => { refs.current[4] = el; }}>
          {(progress) => <Board progress={progress} />}
        </PinnedStep>

        {/* "Resultado": el ejemplo detallado, de principio a fin */}
        <PinnedStep registerRef={(el) => { refs.current[5] = el; }}>
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
      </div>
    </div>
  );
}
