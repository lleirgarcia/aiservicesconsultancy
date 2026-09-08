"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useI18n } from "@/i18n/LocaleContext";

const GROTESK = "var(--font-space-grotesk), 'Space Grotesk', system-ui, sans-serif";
const JMONO = "var(--font-jetbrains), 'JetBrains Mono', ui-monospace, monospace";
const BLUE = "#0d6ef2";

const STEPS = [1, 2, 3, 4] as const;

/** Retardo de la primera tarjeta: entra después del titular y la subfrase. */
const FIRST_DELAY_MS = 420;
const STEP_MS = 110;
const CARD_MS = 850;

type Enlace = { i: number; x1: number; y1: number; x2: number; y2: number; horizontal: boolean };
type Caja = { x: number; y: number; w: number; h: number };

/* La cadena arranca cuando ya han entrado las cuatro tarjetas y va
   alternando: flecha, recorrido del borde, flecha, recorrido… */
/* Duraciones de la cadena. Si se cambian, hay que ajustar también las de
   `.v3-link` y `.v3-trace` en globals.css, que deben coincidir. */
const CADENA_MS = 1600;
const FLECHA_MS = 620;
const TRAZO_MS = 1050;
const PASO_MS = FLECHA_MS + TRAZO_MS;
const RADIO = 14;

/**
 * Contorno que va del punto por donde entra la flecha al punto por donde
 * sale la siguiente, envolviendo la tarjeta por arriba (o por un lado,
 * cuando las tarjetas están apiladas).
 */
function contorno({ x, y, w, h }: Caja, horizontal: boolean) {
  const r = RADIO;
  return horizontal
    ? `M ${x} ${y + h / 2} L ${x} ${y + r} A ${r} ${r} 0 0 1 ${x + r} ${y} ` +
      `L ${x + w - r} ${y} A ${r} ${r} 0 0 1 ${x + w} ${y + r} L ${x + w} ${y + h / 2}`
    : `M ${x + w / 2} ${y} L ${x + w - r} ${y} A ${r} ${r} 0 0 1 ${x + w} ${y + r} ` +
      `L ${x + w} ${y + h - r} A ${r} ${r} 0 0 1 ${x + w - r} ${y + h} L ${x + w / 2} ${y + h}`;
}

export default function Humano() {
  const { t } = useI18n();
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [enlaces, setEnlaces] = useState<Enlace[]>([]);
  const [cajas, setCajas] = useState<Caja[]>([]);
  const [caja, setCaja] = useState({ w: 0, h: 0 });

  /* Se miden posiciones de maquetación (offset*), no rectángulos: las
     tarjetas entran con transform y sus rectángulos mienten mientras dura
     la animación. */
  const medir = useCallback(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    setCaja({ w: wrap.offsetWidth, h: wrap.offsetHeight });

    setCajas(
      cardRefs.current.map((el) =>
        el ? { x: el.offsetLeft, y: el.offsetTop, w: el.offsetWidth, h: el.offsetHeight } : { x: 0, y: 0, w: 0, h: 0 }
      )
    );

    const out: Enlace[] = [];
    for (let i = 0; i < STEPS.length - 1; i++) {
      const a = cardRefs.current[i];
      const b = cardRefs.current[i + 1];
      if (!a || !b) continue;
      const mismaFila = Math.abs(a.offsetTop - b.offsetTop) < 20;
      const mismaColumna = Math.abs(a.offsetLeft - b.offsetLeft) < 20;
      if (mismaFila) {
        out.push({
          i,
          x1: a.offsetLeft + a.offsetWidth,
          y1: a.offsetTop + a.offsetHeight / 2,
          x2: b.offsetLeft,
          y2: b.offsetTop + b.offsetHeight / 2,
          horizontal: true,
        });
      } else if (mismaColumna) {
        out.push({
          i,
          x1: a.offsetLeft + a.offsetWidth / 2,
          y1: a.offsetTop + a.offsetHeight,
          x2: b.offsetLeft + b.offsetWidth / 2,
          y2: b.offsetTop,
          horizontal: false,
        });
      }
      /* En dos columnas el salto de fila cruzaría el bloque: ahí no se dibuja. */
    }
    setEnlaces(out);
  }, []);

  useEffect(() => {
    medir();
    const wrap = wrapRef.current;
    if (!wrap) return;
    const ro = new ResizeObserver(medir);
    ro.observe(wrap);
    window.addEventListener("resize", medir);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", medir);
    };
  }, [medir]);

  return (
    <div ref={wrapRef} className="relative w-full">
      {/* Recorrido 01 → 04: cada tramo se traza cuando su tarjeta ha llegado */}
      {caja.w > 0 && (
        <svg
          className="absolute inset-0 pointer-events-none"
          width={caja.w}
          height={caja.h}
          viewBox={`0 0 ${caja.w} ${caja.h}`}
          aria-hidden
          style={{ overflow: "visible" }}
        >
          {/* De donde entra la flecha a donde nace la siguiente */}
          {cajas.slice(1).map((c, n) => {
            const entrada = enlaces.find((e) => e.i === n);
            if (!c.w || !entrada) return null;
            return (
              <path
                key={`borde-${n}`}
                className="v3-trace"
                d={contorno(c, entrada.horizontal)}
                fill="none"
                stroke={BLUE}
                strokeWidth={2}
                strokeLinecap="round"
                pathLength={1}
                style={{ "--delay": `${CADENA_MS + n * PASO_MS + FLECHA_MS}ms` } as React.CSSProperties}
              />
            );
          })}

          {enlaces.map(({ i, x1, y1, x2, y2, horizontal }) => {
            const retardo = `${CADENA_MS + i * PASO_MS}ms`;
            const dx = horizontal ? -7 : 0;
            const dy = horizontal ? 0 : -7;
            return (
              <g key={i} style={{ "--delay": retardo } as React.CSSProperties}>
                <line
                  className="v3-link"
                  x1={x1}
                  y1={y1}
                  x2={x2 + dx}
                  y2={y2 + dy}
                  stroke={BLUE}
                  strokeWidth={1.8}
                  opacity={0.55}
                  pathLength={1}
                />
                <polygon
                  className="v3-link-tip"
                  points={
                    horizontal
                      ? `${x2},${y2} ${x2 - 7},${y2 - 4} ${x2 - 7},${y2 + 4}`
                      : `${x2},${y2} ${x2 - 4},${y2 - 7} ${x2 + 4},${y2 - 7}`
                  }
                  fill={BLUE}
                  opacity={0.55}
                />
              </g>
            );
          })}
        </svg>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-x-3 xl:gap-x-10 gap-y-3 w-full text-left">
        {STEPS.map((k, i) => (
          <div
            key={k}
            ref={(el) => {
              cardRefs.current[i] = el;
            }}
            className="v3-hover v3-enter relative"
            style={
              {
                "--dy": "120px",
                "--sc": 0.98,
                "--delay": `${FIRST_DELAY_MS + i * STEP_MS}ms`,
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 14,
                boxShadow: "0 8px 16px -8px rgba(16, 20, 24, 0.18), 0 2px 4px -2px rgba(16, 20, 24, 0.07)",
                padding: "clamp(0.95rem, 1.7vw, 1.4rem)",
              } as React.CSSProperties
            }
          >
            <span
              style={{
                fontFamily: JMONO,
                fontSize: "0.74rem",
                fontWeight: 700,
                color: "var(--accent)",
                display: "block",
                marginBottom: "0.5rem",
              }}
            >
              0{k}
            </span>
            <p
              style={{
                fontFamily: GROTESK,
                fontSize: "clamp(0.98rem, 1.25vw, 1.12rem)",
                fontWeight: 600,
                lineHeight: 1.3,
                color: "var(--fg)",
                margin: 0,
                marginBottom: "0.35rem",
              }}
            >
              {t(`v3.humano.t${k}`)}
            </p>
            <p style={{ fontSize: "0.9rem", lineHeight: 1.5, color: "var(--muted)", margin: 0 }}>
              {t(`v3.humano.b${k}`)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
