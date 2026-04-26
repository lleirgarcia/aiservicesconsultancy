"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence, type Transition } from "framer-motion";
import { openChatWithPrompt } from "@/lib/openChatWithPrompt";
import { useI18n } from "@/i18n/LocaleContext";
import type { Locale } from "@/i18n/dict";
import serviciosEs from "@/data/servicios/servicios.es.json";
import serviciosEn from "@/data/servicios/servicios.en.json";
import serviciosCa from "@/data/servicios/servicios.ca.json";

type Caso = (typeof serviciosEs)[number];

const SERVICIOS_BY_LOCALE: Record<Locale, Caso[]> = {
  es: serviciosEs,
  en: serviciosEn,
  ca: serviciosCa,
};

function buildChatPromptForCaso(
  caso: Caso,
  t: (key: string, vars?: Record<string, string | number | undefined>) => string
): string {
  return [
    t("chatCaso.l1", { titulo: caso.titulo }),
    "",
    t("chatCaso.l2"),
    caso.problema,
    "",
    t("chatCaso.l3"),
    caso.solucion,
    "",
    t("chatCaso.l4"),
  ].join("\n");
}

const SPRING: Transition = {
  type: "spring",
  stiffness: 320,
  damping: 28,
  mass: 0.9,
};

export default function ServiciosCarrusel() {
  const { locale, t } = useI18n();
  const servicios = useMemo(
    () => SERVICIOS_BY_LOCALE[locale],
    [locale]
  );
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);

  function goTo(index: number) {
    setDirection(index > current ? 1 : -1);
    setCurrent(index);
  }

  function prev() {
    goTo(current === 0 ? servicios.length - 1 : current - 1);
  }

  function next() {
    goTo(current === servicios.length - 1 ? 0 : current + 1);
  }

  const servicio = servicios[current];
  const nav = [
    { label: t("servicios.prev"), action: prev },
    { label: t("servicios.next"), action: next },
  ] as const;

  return (
    <div
      className="min-w-0 max-w-full"
      style={{ borderBottom: "1px solid var(--border)" }}
    >
      <div className="min-w-0 max-w-full px-5 sm:px-8 py-10 sm:py-14">
        <div className="flex items-center justify-between mb-8">
          <span
            style={{
              fontFamily: "var(--font-geist-mono), monospace",
              fontSize: 12,
              color: "var(--muted)",
            }}
          >
            {current + 1} / {servicios.length}
          </span>
          <div className="flex gap-2">
            {nav.map(({ label, action }, i) => (
              <button
                key={label}
                onClick={action}
                className="w-11 h-11 sm:w-9 sm:h-9"
                style={{
                  background: "transparent",
                  border: "1px solid var(--border)",
                  borderRadius: 4,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "var(--muted)",
                  fontSize: 18,
                  flexShrink: 0,
                  transition: "border-color 0.15s, color 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--fg)";
                  e.currentTarget.style.color = "var(--fg)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--border)";
                  e.currentTarget.style.color = "var(--muted)";
                }}
                aria-label={label}
                type="button"
              >
                {i === 0 ? "←" : "→"}
              </button>
            ))}
          </div>
        </div>

        <div
          className="min-w-0 max-w-full relative"
          style={{ overflowX: "hidden", overflowY: "visible" }}
        >
          <AnimatePresence mode="wait" initial={false} custom={direction}>
            <motion.div
              key={current + locale}
              custom={direction}
              variants={{
                enter: (d: number) => ({
                  x: d > 0 ? "60%" : "-60%",
                  opacity: 0,
                  scale: 0.96,
                }),
                center: {
                  x: 0,
                  opacity: 1,
                  scale: 1,
                },
                exit: (d: number) => ({
                  x: d > 0 ? "-60%" : "60%",
                  opacity: 0,
                  scale: 0.96,
                }),
              }}
              initial="enter"
              animate="center"
              exit="exit"
              transition={SPRING}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragEnd={(_, info) => {
                if (info.offset.x < -50) next();
                else if (info.offset.x > 50) prev();
              }}
              className="min-w-0 w-full max-w-full"
              style={{ position: "relative", touchAction: "pan-y" }}
            >
              <div
                className="min-w-0 max-w-full"
                style={{
                  border: "1px solid var(--border)",
                  borderRadius: 6,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    padding: "20px 24px",
                    borderBottom: "1px solid var(--border)",
                    background: "var(--bg-section)",
                  }}
                >
                  <h3 className="min-w-0 text-xl sm:text-2xl font-bold tracking-tight break-words">
                    {servicio.titulo}
                  </h3>
                </div>

                <div className="grid min-w-0 sm:grid-cols-2">
                  <div
                    className="min-w-0"
                    style={{
                      padding: "24px",
                      borderBottom: "1px solid var(--border)",
                      borderRight: "1px solid var(--border)",
                    }}
                  >
                    <p
                      className="text-xs font-medium uppercase tracking-widest mb-3"
                      style={{ color: "var(--muted)" }}
                    >
                      {t("servicios.problem")}
                    </p>
                    <p
                      className="text-sm leading-relaxed break-words"
                      style={{ fontStyle: "italic", opacity: 0.85 }}
                    >
                      {servicio.problema}
                    </p>
                  </div>
                  <div
                    className="min-w-0"
                    style={{
                      padding: "24px",
                      borderBottom: "1px solid var(--border)",
                    }}
                  >
                    <p
                      className="text-xs font-medium uppercase tracking-widest mb-3"
                      style={{ color: "var(--accent)" }}
                    >
                      {t("servicios.solution")}
                    </p>
                    <p
                      className="text-sm leading-relaxed break-words"
                      style={{ color: "var(--muted)" }}
                    >
                      {servicio.solucion}
                    </p>
                  </div>
                </div>

                <div
                  style={{
                    padding: "16px 24px 20px",
                    borderTop: "1px solid var(--border)",
                    background: "var(--bg-soft)",
                  }}
                >
                  <button
                    type="button"
                    onClick={() =>
                      openChatWithPrompt({
                        prompt: buildChatPromptForCaso(servicio, t),
                        autoSend: true,
                      })
                    }
                    className="w-full text-left text-sm font-semibold uppercase tracking-wide transition-colors"
                    style={{
                      background: "transparent",
                      border: "1px solid var(--border)",
                      borderRadius: 4,
                      padding: "12px 16px",
                      color: "var(--fg)",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "var(--accent)";
                      e.currentTarget.style.color = "var(--accent)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "var(--border)";
                      e.currentTarget.style.color = "var(--fg)";
                    }}
                  >
                    {t("servicios.moreButton")}
                  </button>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
