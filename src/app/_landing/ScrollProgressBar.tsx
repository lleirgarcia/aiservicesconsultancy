"use client";

import { useEffect, useRef } from "react";

/**
 * Barra fina y fija arriba del todo: indica cuánto llevas scrolleado de la
 * página. Escala con `transform` (no `width`) y se actualiza por
 * `requestAnimationFrame` escribiendo directamente en el DOM, sin pasar por
 * estado de React — animar `width` fuerza recálculo de layout en cada
 * scroll y se nota a tirones; `transform` lo compone la GPU y queda fluido
 * incluso con scroll muy rápido.
 */
export default function ScrollProgressBar() {
  const barRef = useRef<HTMLDivElement | null>(null);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const update = () => {
      frameRef.current = null;
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - doc.clientHeight;
      const pct = scrollable > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollable)) : 0;
      if (barRef.current) barRef.current.style.transform = `scaleX(${pct})`;
    };
    const schedule = () => {
      if (frameRef.current == null) frameRef.current = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (frameRef.current != null) cancelAnimationFrame(frameRef.current);
    };
  }, []);

  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: 3,
        zIndex: 60,
        background: "transparent",
        pointerEvents: "none",
      }}
    >
      <div
        ref={barRef}
        style={{
          height: "100%",
          width: "100%",
          transform: "scaleX(0)",
          transformOrigin: "left",
          background: "var(--accent)",
          transition: "transform 0.12s ease-out",
          willChange: "transform",
        }}
      />
    </div>
  );
}
