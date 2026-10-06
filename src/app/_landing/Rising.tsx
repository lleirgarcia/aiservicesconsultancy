"use client";

import type { ReactNode } from "react";
import { useScrollProgress, easeOut } from "./scrollProgress";

/**
 * La sección sube al entrar en pantalla, y su contenido sube por su cuenta
 * a otra velocidad. El div que mide no lleva transform: si lo llevara, su
 * propia posición alteraría la medida y la animación se realimentaría.
 */
export default function Rising({ head, body }: { head: ReactNode; body: ReactNode }) {
  const { ref, progress } = useScrollProgress<HTMLDivElement>({ start: 1.05, end: 0.28 });
  const p = easeOut(progress);
  const inv = 1 - p;

  return (
    <div ref={ref}>
      <div
        style={{
          transform: `translateY(${120 * inv}px) scale(${0.985 + 0.015 * p})`,
          opacity: 0.35 + 0.65 * p,
          willChange: "opacity, transform",
        }}
      >
        <div style={{ transform: `translateY(${48 * inv}px)`, willChange: "transform" }}>{head}</div>
        <div style={{ transform: `translateY(${156 * inv}px)`, willChange: "transform" }}>{body}</div>
      </div>
    </div>
  );
}
