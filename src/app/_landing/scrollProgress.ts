"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Progreso 0→1 de un elemento según su posición en la ventana.
 * Se recalcula en cada scroll, así que al subir la animación va hacia atrás.
 * Con `prefers-reduced-motion` devuelve 1 (estado final, sin animar).
 */
export function useScrollProgress<T extends HTMLElement>(
  /** Fracciones del alto de ventana donde el progreso vale 0 y 1. */
  opts?: { start?: number; end?: number }
) {
  const ref = useRef<T | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setProgress(1);
      return;
    }

    let raf = 0;
    const update = () => {
      raf = 0;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      // Arranca cuando el bloque ya ha entrado un cuarto de pantalla (si no,
      // termina antes de que el usuario llegue a mirarlo) y acaba con el
      // bloque bien centrado.
      const start = vh * (opts?.start ?? 0.74);
      const end = vh * (opts?.end ?? 0.14);
      const v = (start - rect.top) / (start - end);
      setProgress(v < 0 ? 0 : v > 1 ? 1 : v);
    };

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [opts?.start, opts?.end]);

  return { ref, progress };
}

/** A partir de este ancho la sección se fija (coincide con el `md` de Tailwind). */
const PINNED_MIN_WIDTH = "(min-width: 768px)";

/**
 * Fracción final del recorrido fijado que se reserva como pausa: el progreso
 * llega a 1 (animación terminada) un poco antes de agotar el alto extra real,
 * así que al terminar de animarse la sección se queda quieta un momento antes
 * de soltar el scroll a la siguiente, en vez de pasar de golpe.
 */
const PINNED_END_BUFFER = 0.14;

/**
 * Progreso 0→1 de una sección "fijada": en escritorio la sección usa
 * `position: sticky` y, mientras es más alta que la ventana, el progreso
 * avanza según lo que se ha hecho scroll a través de ella (de "su borde
 * superior toca arriba" a "su borde inferior toca abajo"), dando el efecto
 * de quedarse fija mientras su animación interna avanza con el scroll y
 * saltar a la siguiente sección en cuanto termina. En pantallas donde la
 * sección no se fija (p. ej. móvil, sin el alto extra de escritorio) se usa
 * en cambio una revelación normal según el contenido entra desde abajo del
 * todo — si no, con el cálculo de "fijado" el contenido se quedaría
 * invisible hasta que su borde superior llegase arriba del todo, aunque ya
 * estuviera a la vista.
 */
export function usePinnedProgress<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setProgress(1);
      return;
    }

    const pinnedMq = window.matchMedia(PINNED_MIN_WIDTH);

    let raf = 0;
    const update = () => {
      raf = 0;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || 1;

      if (pinnedMq.matches) {
        const total = rect.height - vh;
        if (total <= 0) {
          setProgress(1);
          return;
        }
        const effectiveTotal = total * (1 - PINNED_END_BUFFER);
        const v = effectiveTotal > 0 ? -rect.top / effectiveTotal : 1;
        setProgress(v < 0 ? 0 : v > 1 ? 1 : v);
      } else {
        const start = vh * 0.74;
        const end = vh * 0.14;
        const v = (start - rect.top) / (start - end);
        setProgress(v < 0 ? 0 : v > 1 ? 1 : v);
      }
    };

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return { ref, progress };
}

/** Tramo [a,b] del progreso global, normalizado a 0→1. */
export function seg(p: number, a: number, b: number) {
  if (b <= a) return p >= b ? 1 : 0;
  const v = (p - a) / (b - a);
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

/** Suavizado de salida, para que nada entre de golpe. */
export function easeOut(t: number) {
  return 1 - Math.pow(1 - t, 3);
}
