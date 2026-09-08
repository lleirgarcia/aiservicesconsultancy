"use client";

import { useEffect, useRef } from "react";
import { createUniverse } from "./universe";

/**
 * Campo de estrellas de fondo: blanco arriba, noche abajo, según el scroll.
 *
 * Publica el avance en `--night`, que solo gradúa el velo blanco de encima.
 * El interfaz no cambia de colores: el fondo es secundario.
 */
export default function UniverseBackground({
  count = 4200,
  /** Las estrellas no aparecen hasta pasar este bloque. */
  startAfter = ".v3-hero-vh",
}: {
  count?: number;
  startAfter?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const root = canvas.parentElement;

    /* El umbral se calcula con la altura real del bloque, no con un
       porcentaje fijo: así sigue cuadrando si la página crece. */
    const opts: { count: number; theme: "paper"; inkStart: number; onProgress: (n: number) => void } = {
      count,
      theme: "paper",
      inkStart: 0.2,
      onProgress: (night) => {
        root?.style.setProperty("--night", night.toFixed(3));
        /* La altura de la página cambia después de montar (fuentes, tarjetas
           que entran…). Se revisa el umbral un par de veces por segundo: si
           se calculara solo al principio, las estrellas arrancarían tarde. */
        const ahora = performance.now();
        if (ahora - ultimaMedida > 400) {
          ultimaMedida = ahora;
          measure();
        }
      },
    };

    let ultimaMedida = 0;

    const measure = () => {
      const hero = document.querySelector<HTMLElement>(startAfter);
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (!hero || maxScroll <= 0) return;
      const finDelHero = hero.offsetTop + hero.offsetHeight;
      opts.inkStart = Math.max(0, Math.min(0.9, finDelHero / maxScroll));
    };

    measure();
    const universe = createUniverse(canvas, opts);
    window.addEventListener("resize", measure);

    return () => {
      window.removeEventListener("resize", measure);
      universe.destroy();
      root?.style.removeProperty("--night");
    };
  }, [count, startAfter]);

  return (
    <>
      <canvas ref={canvasRef} className="v3-universe" aria-hidden />
      {/* Velo: oscurece el cielo bajo el contenido para que el texto claro
          tenga siempre fondo suficiente. */}
      <div className="v3-universe-veil" aria-hidden />
    </>
  );
}
