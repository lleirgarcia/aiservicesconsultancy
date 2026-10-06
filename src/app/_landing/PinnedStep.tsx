"use client";

import { ReactNode } from "react";
import { usePinnedProgress } from "./scrollProgress";

const STICKY_TOP_PX = 96;

/**
 * Envoltorio de cada paso del stepper "Cómo lo hacemos": en escritorio se
 * queda fijo en pantalla (`sticky`) mientras el usuario sigue haciendo scroll,
 * y ese scroll adicional es lo que anima su contenido (vía `progress`). En
 * cuanto la animación llega a 1, el scroll libera la sección y pasa a la
 * siguiente. En pantallas donde la sección no se fija (p. ej. móvil, sin el
 * alto extra de escritorio) el contenido simplemente aparece completo, sin
 * bloquear el scroll.
 */
export default function PinnedStep({
  registerRef,
  /** Si el contenido debe ocupar todo el alto fijado (p. ej. un gráfico que se estira) en vez de centrarse por su alto natural. */
  fill = false,
  /** Más alto extra de lo normal: para pasos con varias escenas secuenciales que necesitan más recorrido de scroll. */
  tall = false,
  children,
}: {
  registerRef: (el: HTMLDivElement | null) => void;
  fill?: boolean;
  tall?: boolean;
  children: (progress: number) => ReactNode;
}) {
  const { ref, progress } = usePinnedProgress<HTMLDivElement>();

  return (
    <div
      ref={(el) => {
        ref.current = el;
        registerRef(el);
      }}
      className={`relative ${tall ? "md:min-h-[760vh]" : "md:min-h-[230vh]"}`}
    >
      <div
        className={
          fill
            ? "md:sticky flex items-stretch md:h-[calc(100vh_-_96px_-_2.5rem)]"
            : "md:sticky flex items-center md:min-h-[calc(100vh_-_96px_-_2.5rem)]"
        }
        style={{ top: STICKY_TOP_PX, paddingTop: "1.5rem", paddingBottom: "2.5rem" }}
      >
        <div className={fill ? "w-full md:h-full" : "w-full"}>{children(progress)}</div>
      </div>
    </div>
  );
}
