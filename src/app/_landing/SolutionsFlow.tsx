"use client";

import { useI18n } from "@/i18n/LocaleContext";
import { seg, easeOut } from "./scrollProgress";
import RocketScene from "./RocketScene";

const GROTESK = "var(--font-space-grotesk), 'Space Grotesk', system-ui, sans-serif";
const JMONO = "var(--font-jetbrains), 'JetBrains Mono', ui-monospace, monospace";

const BLUE = "#0d6ef2";
const AMBER = "#f59e0b";
const GREEN = "#16a34a";
const RED = "#dc2626";
const SLATE = "#475569";

/** Los 5 tramos de scroll en los que se reparte la sección: cada uno es una escena a pantalla completa. */
const SCENES = [
  { key: "identify", start: 0, end: 0.14 },
  { key: "propose", start: 0.14, end: 0.42 },
  { key: "prototype", start: 0.42, end: 0.56 },
  { key: "loop", start: 0.56, end: 0.82 },
  { key: "deliver", start: 0.82, end: 1 },
] as const;

/**
 * Opacidad y progreso local [0,1] de una escena dentro del recorrido total.
 * El fundido de entrada y salida va SIEMPRE dentro del propio tramo [start,end]
 * de la escena (nunca se sale de él), para que dos escenas consecutivas no
 * lleguen a estar visibles a la vez y su texto se solape.
 */
function sceneState(progress: number, start: number, end: number, noFadeOut = false) {
  const fade = Math.min(0.02, (end - start) / 3);
  let opacity = 0;
  if (progress >= start && progress <= end) {
    opacity = noFadeOut ? Math.min(1, (progress - start) / fade) : Math.min(1, (progress - start) / fade, (end - progress) / fade);
  }
  return { opacity, local: seg(progress, start, end), active: opacity > 0.3 };
}

/** Icono de línea reutilizado en las cabeceras de escena. */
const ICONS: Record<string, React.ReactNode> = {
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" />
    </>
  ),
  bulb: (
    <>
      <path d="M9 18h6M10 21h4" />
      <path d="M12 3a6 6 0 0 0-3.5 10.9V15h7v-1.1A6 6 0 0 0 12 3z" />
    </>
  ),
  handshake: (
    <>
      <rect x="4" y="5" width="16" height="14" rx="2" />
      <path d="M8 12l2.5 2.5L16 9" />
    </>
  ),
  loop: (
    <>
      <path d="M20 11a8 8 0 1 0-2.6 5.9" />
      <path d="M20 5v6h-6" />
    </>
  ),
  box: (
    <>
      <path d="M3 8l9-5 9 5-9 5-9-5z" />
      <path d="M3 8v8l9 5 9-5V8M12 13v8" />
    </>
  ),
};

function HeaderIcon({ name, color }: { name: string; color: string }) {
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

/** Tamaño fijo y común a las 5 escenas, para que ninguna "cambie de caja" al pasar de una a otra. */
const SCENE_WIDTH = 680;
const SCENE_MIN_HEIGHT = 480;

/**
 * Envoltorio común de cada escena: un único recuadro con el título pegado a
 * su contenido (nada de hueco grande entre cabecera y cuerpo), centrado en
 * la pantalla completa del paso. Las 5 escenas comparten el mismo tamaño de
 * caja, para que el conjunto no "salte" al cambiar de una a otra.
 */
function Scene({
  icon,
  color,
  title,
  sub,
  opacity,
  footer,
  bleed,
  children,
}: {
  icon: string;
  color: string;
  title: string;
  sub?: string;
  opacity: number;
  /** Franja a ancho completo pegada abajo del todo (ignora el padding de la tarjeta). */
  footer?: React.ReactNode;
  /** El contenido ocupa toda la tarjeta de borde a borde; el título flota como badge encima. */
  bleed?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className="v3-scene relative md:absolute md:inset-0 flex items-center justify-center"
      style={
        {
          "--scene-opacity": opacity,
          pointerEvents: opacity > 0.5 ? "auto" : "none",
          willChange: "opacity",
        } as React.CSSProperties
      }
    >
      <div
        className="flex flex-col relative"
        style={{
          width: "100%",
          maxWidth: SCENE_WIDTH,
          minHeight: SCENE_MIN_HEIGHT,
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 16,
          boxShadow: "0 16px 40px rgba(16,20,24,0.1)",
          overflow: "hidden",
        }}
      >
        {bleed ? (
          <>
            <div
              className="absolute flex items-center gap-2.5"
              style={{
                top: "1.1rem",
                left: "1.1rem",
                zIndex: 2,
                background: "color-mix(in srgb, var(--surface) 88%, transparent)",
                backdropFilter: "blur(2px)",
                borderRadius: 999,
                padding: "0.35rem 0.9rem 0.35rem 0.35rem",
                boxShadow: "0 2px 10px rgba(16,20,24,0.14)",
              }}
            >
              <HeaderIcon name={icon} color={color} />
              <h3 style={{ fontFamily: GROTESK, fontSize: "0.95rem", fontWeight: 700, color: "var(--fg)", margin: 0 }}>{title}</h3>
            </div>
            <div
              className="relative md:absolute md:inset-0 flex items-center justify-center"
              style={{ width: "100%", aspectRatio: "3 / 2" }}
            >
              {children}
            </div>
          </>
        ) : (
          <>
            <div style={{ padding: "1.6rem 1.85rem 0" }}>
              <div className="flex items-center gap-3" style={{ marginBottom: "1.1rem" }}>
                <HeaderIcon name={icon} color={color} />
                <div>
                  <h3 style={{ fontFamily: GROTESK, fontSize: "1.05rem", fontWeight: 700, color: "var(--fg)", margin: 0 }}>{title}</h3>
                  {sub && <p style={{ fontSize: "0.82rem", color: "var(--muted)", margin: "0.15rem 0 0" }}>{sub}</p>}
                </div>
              </div>
            </div>
            <div className="flex-1 flex items-center justify-center" style={{ padding: `0 1.85rem ${footer ? 0 : "1.9rem"}` }}>
              {children}
            </div>
            {footer}
          </>
        )}
      </div>
    </div>
  );
}

/** Escena 1 — "Identificamos procesos": listamos 10 procesos, muy rápido. */
function IdentifyScene({ opacity, local }: { opacity: number; local: number }) {
  const { t } = useI18n();
  const rows = Array.from({ length: 10 }, (_, i) => i + 1);
  return (
    <Scene icon="search" color={BLUE} title={t("v3.demo.sol1t")} opacity={opacity}>
      <div className="grid grid-cols-2 gap-x-10 gap-y-3" style={{ width: "100%", maxWidth: 420 }}>
        {rows.map((n, i) => {
          const r = easeOut(seg(local, i * 0.065, 0.12 + i * 0.065));
          const fromLeft = i % 2 === 0;
          return (
            <div
              key={n}
              style={{
                opacity: r,
                transform: `translateX(${(1 - r) * (fromLeft ? -14 : 14)}px)`,
                display: "flex",
                alignItems: "baseline",
                gap: "0.5rem",
              }}
            >
              <span style={{ fontFamily: JMONO, fontSize: "0.75rem", fontWeight: 700, color: BLUE }}>
                {String(n).padStart(2, "0")}
              </span>
              <span style={{ fontFamily: GROTESK, fontSize: "0.9rem", fontWeight: 600, color: "var(--fg)" }}>
                {t("v3.demo.processWord")} {n}
              </span>
            </div>
          );
        })}
      </div>
    </Scene>
  );
}

const DOC_FIELDS = [
  { labelKey: "v3.demo.docF1", color: BLUE, dots: 40 },
  { labelKey: "v3.demo.docF2", color: RED, dots: 24 },
  { labelKey: "v3.demo.docF3", color: AMBER, dots: 52 },
  { labelKey: "v3.demo.docF4", color: GREEN, dots: 17 },
];

/** Línea de puntos negra (no en negrita) que "se escribe" para no dejar el campo vacío; cada campo tiene un largo distinto. */
function DottedLine({ dots, reveal }: { dots: number; reveal: number }) {
  return (
    <span
      aria-hidden
      style={{
        display: "block",
        overflow: "hidden",
        fontFamily: JMONO,
        fontWeight: 400,
        fontSize: "0.95rem",
        letterSpacing: "0.12em",
        color: "var(--fg)",
        opacity: 0.55,
        whiteSpace: "nowrap",
        transform: `scaleX(${reveal})`,
        transformOrigin: "left",
        willChange: "transform",
      }}
    >
      {"·".repeat(dots)}
    </span>
  );
}

/** Escena 2 — "Proponemos soluciones": un documento con la ficha de la solución, campo a campo. */
function ProposeScene({ opacity, local }: { opacity: number; local: number }) {
  const { t } = useI18n();
  return (
    <Scene icon="bulb" color={AMBER} title={t("v3.demo.sol2t")} opacity={opacity}>
      <div style={{ width: "100%" }}>
        <h4 style={{ fontFamily: GROTESK, fontSize: "1.05rem", fontWeight: 700, color: "var(--fg)", margin: "0 0 1.25rem" }}>
          {t("v3.demo.docTitle")}
        </h4>
        <div className="flex flex-col" style={{ gap: "1.1rem" }}>
          {DOC_FIELDS.map((f, i) => {
            const a = 0.1 + i * 0.2;
            const labelReveal = easeOut(seg(local, a, a + 0.06));
            const lineReveal = easeOut(seg(local, a + 0.04, a + 0.17));
            return (
              <div key={f.labelKey} style={{ opacity: labelReveal }}>
                <span
                  style={{
                    display: "inline-block",
                    fontFamily: JMONO,
                    fontSize: "0.68rem",
                    fontWeight: 700,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase" as const,
                    color: f.color,
                    background: `color-mix(in srgb, ${f.color} 12%, transparent)`,
                    border: `1px solid color-mix(in srgb, ${f.color} 35%, transparent)`,
                    borderRadius: 999,
                    padding: "0.18rem 0.55rem",
                    marginBottom: "0.4rem",
                  }}
                >
                  {t(f.labelKey)}
                </span>
                <DottedLine dots={f.dots} reveal={lineReveal} />
              </div>
            );
          })}
        </div>
      </div>
    </Scene>
  );
}

/** Escena 3 — "Acordamos un prototipo": el cohete se dibuja a medida que haces scroll. */
function PrototypeScene({ opacity, local }: { opacity: number; local: number }) {
  const { t } = useI18n();
  return (
    <Scene icon="handshake" color={GREEN} title={t("v3.demo.sol3t")} opacity={opacity} bleed>
      <RocketScene local={local} />
    </Scene>
  );
}

/** Escena 4 — "Enseñamos / Iteramos / Afinamos": bucle entre Kroomix y el equipo del cliente. */
function LoopScene({ opacity, active }: { opacity: number; active: boolean }) {
  const { t } = useI18n();
  const words = [t("v3.demo.sol4t"), t("v3.demo.sol5t"), t("v3.demo.sol6t")];
  return (
    <Scene icon="loop" color={BLUE} title={t("v3.demo.loopTitle")} sub={t("v3.demo.loopSub")} opacity={opacity}>
      <style>{`
        @keyframes solLoopSpin { to { stroke-dashoffset: -88; } }
        @keyframes solLoopWord { 0%, 27% { opacity: 1; transform: translateY(0); } 33%, 94% { opacity: 0; transform: translateY(-6px); } 100% { opacity: 0; } }
      `}</style>
      <div className="flex items-center justify-center gap-2 sm:gap-6 md:gap-10" style={{ padding: "1rem 0" }}>
        <div
          className="w-[92px] sm:w-[132px] md:w-[168px] text-[0.72rem] sm:text-[0.92rem] md:text-[1.05rem]"
          style={{
            textAlign: "center" as const,
            background: "var(--surface)",
            border: `2px solid ${BLUE}`,
            borderRadius: 14,
            boxShadow: "0 1px 3px rgba(16,20,24,0.07)",
            padding: "1.5rem 0.4rem",
            fontFamily: GROTESK,
            fontWeight: 700,
            color: "var(--fg)",
          }}
        >
          {t("v3.demo.loopUs")}
        </div>

        <div
          className="relative flex flex-col items-center justify-center shrink-0 w-[76px] sm:w-[112px] md:w-[140px]"
          style={{ aspectRatio: "140 / 104" }}
        >
          <svg width="100%" height="100%" viewBox="0 0 140 104" fill="none" aria-hidden>
            <path
              d="M8 34 Q70 -6 132 34"
              stroke={BLUE}
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeDasharray="8 8"
              style={active ? { animation: "solLoopSpin 1.1s linear infinite" } : undefined}
            />
            <path d="M123 25 L132 34 L121 40" stroke={BLUE} strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <path
              d="M132 70 Q70 110 8 70"
              stroke={SLATE}
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeDasharray="8 8"
              style={active ? { animation: "solLoopSpin 1.1s linear infinite" } : undefined}
            />
            <path d="M17 79 L8 70 L19 64" stroke={SLATE} strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div className="relative" style={{ height: "1.6rem", width: "100%", marginTop: "0.4rem" }}>
            {words.map((w, i) => (
              <span
                key={w}
                className="text-[0.62rem] sm:text-[0.78rem] md:text-[0.86rem]"
                style={{
                  position: "absolute",
                  inset: 0,
                  textAlign: "center",
                  whiteSpace: "nowrap",
                  fontFamily: JMONO,
                  fontWeight: 700,
                  color: BLUE,
                  opacity: 0,
                  ...(active ? { animation: `solLoopWord 3.3s ease-in-out ${i * 1.1}s infinite` } : { opacity: i === 0 ? 1 : 0 }),
                }}
              >
                {w}
              </span>
            ))}
          </div>
        </div>

        <div
          className="w-[92px] sm:w-[132px] md:w-[168px] text-[0.72rem] sm:text-[0.92rem] md:text-[1.05rem]"
          style={{
            textAlign: "center" as const,
            background: "var(--surface)",
            border: `2px solid ${SLATE}`,
            borderRadius: 14,
            boxShadow: "0 1px 3px rgba(16,20,24,0.07)",
            padding: "1.5rem 0.4rem",
            fontFamily: GROTESK,
            fontWeight: 700,
            color: "var(--fg)",
          }}
        >
          {t("v3.demo.loopThem")}
        </div>
      </div>
    </Scene>
  );
}

/** Escena 5 — "Entregamos": el producto viaja de Kroomix a la empresa y queda listo. */
function DeliverScene({ opacity, local }: { opacity: number; local: number }) {
  const { t } = useI18n();
  const travel = easeOut(seg(local, 0.05, 0.55));
  const arrived = easeOut(seg(local, 0.55, 0.75));
  const barWidth = 420;
  return (
    <Scene
      icon="box"
      color={GREEN}
      title={t("v3.demo.deliverTitle")}
      sub={t("v3.demo.deliverSub")}
      opacity={opacity}
      footer={
        <div
          style={{
            opacity: arrived,
            flex: "1 0 auto",
            minHeight: 170,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.55rem",
            fontFamily: JMONO,
            fontSize: "0.95rem",
            fontWeight: 700,
            letterSpacing: "0.04em",
            textTransform: "uppercase" as const,
            color: "#fff",
            background: GREEN,
            padding: "1.05rem",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6L9 17l-5-5" />
          </svg>
          {t("v3.demo.sol7s")}
        </div>
      }
    >
      <div className="flex flex-col items-center" style={{ gap: "1.1rem", padding: "0.5rem 0" }}>
        <div className="flex items-center justify-between" style={{ width: "100%", maxWidth: barWidth }}>
          <span style={{ fontFamily: JMONO, fontSize: "0.85rem", fontWeight: 700, color: "var(--muted)" }}>
            {t("v3.demo.loopUs")}
          </span>
          <span
            style={{
              fontFamily: JMONO,
              fontSize: "0.85rem",
              fontWeight: 700,
              color: arrived > 0.5 ? GREEN : "var(--muted)",
            }}
          >
            {t("v3.demo.deliverThem")}
          </span>
        </div>

        <div className="relative" style={{ width: "100%", maxWidth: barWidth, height: 52 }}>
          <span
            aria-hidden
            style={{
              position: "absolute",
              left: 4,
              right: 4,
              top: "50%",
              height: 0,
              borderTop: "2px dashed var(--border-strong, #cbd2da)",
              transform: "translateY(-50%)",
            }}
          />
          <span
            aria-hidden
            style={{
              position: "absolute",
              top: "50%",
              left: `calc(${1 + travel * 98}% )`,
              transform: "translate(-50%, -50%)",
              width: 46,
              height: 46,
              borderRadius: 12,
              background: GREEN,
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 6px 14px rgba(22,163,74,0.35)",
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 8l9-5 9 5-9 5-9-5z" />
              <path d="M3 8v8l9 5 9-5V8" />
            </svg>
          </span>
        </div>
      </div>
    </Scene>
  );
}

/** Puntos indicadores de en qué escena está el usuario. */
function SceneDots({ progress }: { progress: number }) {
  return (
    <div className="flex items-center justify-center" style={{ gap: "0.4rem", marginTop: "1.25rem" }}>
      {SCENES.map((s) => {
        const on = progress >= s.start && progress <= s.end;
        return (
          <span
            key={s.key}
            aria-hidden
            style={{
              width: on ? 16 : 6,
              height: 6,
              borderRadius: 999,
              background: on ? BLUE : "var(--border)",
              transition: "width 0.25s ease, background 0.25s ease",
            }}
          />
        );
      })}
    </div>
  );
}

/** Sección "Soluciones": cómo trabajamos, de principio a fin — cinco escenas a pantalla completa. */
export default function SolutionsFlow({ progress }: { progress: number }) {
  const { t } = useI18n();

  const identify = sceneState(progress, SCENES[0].start, SCENES[0].end);
  const propose = sceneState(progress, SCENES[1].start, SCENES[1].end);
  const prototype = sceneState(progress, SCENES[2].start, SCENES[2].end);
  const loop = sceneState(progress, SCENES[3].start, SCENES[3].end);
  const deliver = sceneState(progress, SCENES[4].start, SCENES[4].end, true);

  return (
    <div className="relative flex flex-col h-full">
      <p
        style={{
          fontFamily: GROTESK,
          fontSize: "clamp(1.1rem, 2vw, 1.45rem)",
          lineHeight: 1.4,
          margin: "0 0 1.25rem",
          maxWidth: "60ch",
          flexShrink: 0,
        }}
      >
        <span style={{ color: "var(--fg)", fontWeight: 600 }}>{t("v3.demo.solucionesLead1")}</span>{" "}
        <span style={{ color: "var(--muted)" }}>{t("v3.demo.solucionesLead2")}</span>
      </p>

      <div className="relative flex-1 min-h-0">
        <IdentifyScene opacity={identify.opacity} local={identify.local} />
        <ProposeScene opacity={propose.opacity} local={propose.local} />
        <PrototypeScene opacity={prototype.opacity} local={prototype.local} />
        <LoopScene opacity={loop.opacity} active={loop.active} />
        <DeliverScene opacity={deliver.opacity} local={deliver.local} />
      </div>

      <SceneDots progress={progress} />
    </div>
  );
}
