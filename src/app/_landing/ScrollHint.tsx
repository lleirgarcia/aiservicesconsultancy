"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useI18n } from "@/i18n/LocaleContext";

const JMONO = "var(--font-jetbrains), 'JetBrains Mono', ui-monospace, monospace";

/**
 * Aviso flotante "sigue haciendo scroll": solo tiene sentido en escritorio,
 * donde cada paso del stepper se queda fijo en pantalla y hace falta scroll
 * extra para que su animación interna avance. En móvil no hay nada fijado
 * (el contenido fluye normal), así que ahí no se muestra.
 *
 * Se monta vía portal: el padre (Rising) envuelve el contenido en divs con
 * `transform`, y eso crea un nuevo "containing block" para cualquier
 * descendiente `position: fixed` — sin portal, el aviso quedaría fijado a ese
 * contenedor transformado (y su posición dependería del scroll) en vez de
 * quedarse fijo de verdad respecto a la ventana. Se porta dentro del propio
 * `.v3-theme` (localizado desde el ancla) para heredar sus variables de
 * color claras, igual que el modal de contacto.
 *
 * La primera vez que el usuario entra en el stepper se muestra a tamaño
 * normal, centrado. A partir de la segunda vez (`compact`) — ya sabe de qué
 * va — se encoge, pierde opacidad y se desplaza a la izquierda, para estorbar
 * menos sin desaparecer del todo.
 */
export default function ScrollHint({
  visible,
  compact = false,
  compactLeft,
}: {
  visible: boolean;
  compact?: boolean;
  /** Borde izquierdo del nav (px desde la ventana), para alinear la versión compacta con él. */
  compactLeft?: number | null;
}) {
  const { t } = useI18n();
  const anchorRef = useRef<HTMLSpanElement | null>(null);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const v3Ancestor = anchorRef.current?.closest(".v3-theme");
    setPortalTarget((v3Ancestor as HTMLElement) ?? document.body);
  }, []);

  const hiddenOffset = visible ? 0 : 12;
  const left = compact ? (compactLeft ?? 24) : "50%";
  const centerShift = compact ? "0" : "-50%";

  return (
    <>
      <span ref={anchorRef} aria-hidden style={{ display: "none" }} />
      {portalTarget &&
        createPortal(
          <div
            aria-hidden={!visible}
            className="hidden md:flex"
            style={{
              position: "fixed",
              left,
              bottom: 56,
              transform: `translateX(${centerShift}) translateY(${hiddenOffset}px) scale(${compact ? 0.78 : 1})`,
              transformOrigin: compact ? "left bottom" : "center bottom",
              zIndex: 70,
              opacity: visible ? (compact ? 0.55 : 1) : 0,
              pointerEvents: "none",
              transition: "opacity 0.3s ease, transform 0.3s ease, left 0.3s ease",
              alignItems: "center",
              gap: "0.5rem",
              background: "var(--fg)",
              color: "var(--surface)",
              borderRadius: 999,
              padding: "0.55rem 1.1rem",
              fontFamily: JMONO,
              fontSize: "0.78rem",
              fontWeight: 700,
              letterSpacing: "0.03em",
              textTransform: "uppercase" as const,
              boxShadow: "0 10px 30px rgba(16,20,24,0.25)",
            }}
          >
            {t("v3.demo.scrollHint")}
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
              style={{ animation: "v3-scroll-hint-bounce 1.3s ease-in-out infinite" }}
            >
              <path d="M12 5v14M6 13l6 6 6-6" />
            </svg>
            <style>{`
              @keyframes v3-scroll-hint-bounce {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(4px); }
              }
            `}</style>
          </div>,
          portalTarget
        )}
    </>
  );
}
