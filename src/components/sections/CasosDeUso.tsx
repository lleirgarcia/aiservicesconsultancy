"use client";

import { useRef, useState } from "react";
import { CASOS } from "@/data/casos-de-uso";
import CasoCard from "@/components/ui/CasoCard";

export default function CasosDeUso() {
  const [indice, setIndice] = useState(0);
  const touchInicioX = useRef<number | null>(null);

  const anterior = () => setIndice((i) => Math.max(0, i - 1));
  const siguiente = () => setIndice((i) => Math.min(CASOS.length - 1, i + 1));

  const onTouchStart = (e: React.TouchEvent) => {
    touchInicioX.current = e.touches[0].clientX;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchInicioX.current === null) return;
    const diferencia = touchInicioX.current - e.changedTouches[0].clientX;
    if (Math.abs(diferencia) > 40) diferencia > 0 ? siguiente() : anterior();
    touchInicioX.current = null;
  };

  return (
    <>
      {/* Barra de navegación */}
      <div
        className="px-5 sm:px-8 py-4 flex items-center justify-between"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <span
          className="text-xs font-medium uppercase tracking-widest"
          style={{ color: "var(--muted)" }}
        >
          {indice + 1} / {CASOS.length}
        </span>
        <div className="flex gap-2">
          <button
            onClick={anterior}
            disabled={indice === 0}
            aria-label="Caso anterior"
            style={{
              width: 36,
              height: 36,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid var(--border)",
              background: "transparent",
              color: indice === 0 ? "var(--border)" : "var(--fg)",
              cursor: indice === 0 ? "default" : "pointer",
              transition: "border-color 0.15s, color 0.15s",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M9 2L4 7L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            onClick={siguiente}
            disabled={indice === CASOS.length - 1}
            aria-label="Caso siguiente"
            style={{
              width: 36,
              height: 36,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid var(--border)",
              background: "transparent",
              color: indice === CASOS.length - 1 ? "var(--border)" : "var(--fg)",
              cursor: indice === CASOS.length - 1 ? "default" : "pointer",
              transition: "border-color 0.15s, color 0.15s",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M5 2L10 7L5 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>

      {/* Carrusel */}
      <div
        style={{ overflow: "hidden" }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div
          style={{
            display: "flex",
            width: `${CASOS.length * 100}%`,
            transform: `translateX(-${(indice / CASOS.length) * 100}%)`,
            transition: "transform 0.4s cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        >
          {CASOS.map((caso, i) => (
            <div
              key={i}
              style={{ width: `${100 / CASOS.length}%`, flexShrink: 0 }}
            >
              <CasoCard caso={caso} />
            </div>
          ))}
        </div>
      </div>

      {/* Indicador de puntos */}
      <div
        className="px-5 sm:px-8 py-4 flex gap-1.5"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        {CASOS.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndice(i)}
            aria-label={`Ir al caso ${i + 1}`}
            style={{
              width: i === indice ? 20 : 6,
              height: 6,
              borderRadius: 3,
              background: i === indice ? "var(--accent)" : "var(--border)",
              border: "none",
              padding: 0,
              cursor: "pointer",
              transition: "width 0.3s ease, background 0.2s ease",
            }}
          />
        ))}
      </div>
    </>
  );
}
