"use client";

import { useEffect } from "react";

/**
 * Intro de carga: el `<html>` ya arranca con la clase
 * `collapse-intro-armed` (desde `layout.tsx`), lo que provoca que todos
 * los bloques marcados con `data-collapsible` se rendericen plegados.
 *
 * Este componente, tras `delay` ms, añade la clase `sections-expanded`
 * para disparar el despliegue suave + escalonado (ver `globals.css`).
 *
 * Para usuarios con `prefers-reduced-motion`, el despliegue es
 * inmediato.
 */
export default function CollapseIntro({
  delay = 2000,
}: {
  delay?: number;
}) {
  useEffect(() => {
    const root = document.documentElement;

    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReduced) {
      root.classList.add("sections-expanded");
      return;
    }

    const id = window.setTimeout(() => {
      root.classList.add("sections-expanded");
    }, delay);

    return () => {
      window.clearTimeout(id);
    };
  }, [delay]);

  return null;
}
