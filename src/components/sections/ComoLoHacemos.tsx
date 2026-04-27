"use client";

import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/i18n/LocaleContext";
import SectionHeader from "@/components/ui/SectionHeader";

const HEADLINE_FONT = "var(--font-space-grotesk), 'Space Grotesk', system-ui, sans-serif";

const PROCESOS = [
  {
    id: "01",
    title: "Construimos sistemas digitales y automatizados que evitan tareas humanas repetitivas",
    body: "Construimos sistemas digitales que a ti y a tu equipo os hacen perder el tiempo y no aportan un valor real a tu negocio. Ahorrar tiempo en tareas que podrían estar automatizadas es una necesidad real de cualquier negocio. Deja que una máquina realice esas tareas mientras tú inviertes tiempo en lo importante.",
    align: "left" as const,
    image: "/como-01.png",
  },
  {
    id: "02",
    title: "Añadimos inteligencia a tus procesos digitales para ayudarte a tomar mejores decisiones",
    body: "Creamos procesos que toman decisiones de forma 100% autónoma (o casi autónoma), eliminando las horas que debe invertir una persona, recopilando información, procesándola, interpretándola y tomando una decisión. Definimos criterios claros según tu negocio y los automatizamos.",
    align: "right" as const,
    image: "/como-02.png",
  },
  {
    id: "03",
    title: "Clarificamos la operativa digital de tu empresa",
    body: "Eliminamos la complejidad de entender todos los procesos digitales de tu empresa, para qué sirven y en qué te benefician, con tal de que tú y tu empresa entendáis en cada momento las herramientas que se utilizan, para qué se utilizan y sus beneficios. Todo en números.",
    align: "left" as const,
    image: "/como-03.png",
  },
];

export default function ComoLoHacemos() {
  const { t } = useI18n();
  const [visibleCards, setVisibleCards] = useState<Set<string>>(new Set());
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute("data-card-id");
            if (id) {
              setVisibleCards((prev) => new Set([...prev, id]));
            }
          }
        });
      },
      { threshold: 0.15 }
    );

    cardRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <>
      <style>{`
        @keyframes slideInFromLeft {
          from {
            opacity: 0;
            transform: translateX(-60px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes slideInFromRight {
          from {
            opacity: 0;
            transform: translateX(60px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .card-visible-left {
          animation: slideInFromLeft 0.6s ease-out forwards;
        }

        .card-visible-right {
          animation: slideInFromRight 0.6s ease-out forwards;
        }
      `}</style>

      <div
        style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-section)" }}
      >
        <div className="max-w-[1280px] mx-auto px-6 sm:px-8 py-8 sm:py-10">
          <SectionHeader
            title={t("sectionComoLoHacemos.heading")}
            subtitle="LO QUE HACEMOS"
          />
        </div>
      </div>

      <div style={{ background: "var(--bg)", borderBottom: "1px solid var(--border)" }}>
        <div className="max-w-[1280px] mx-auto px-6 sm:px-8 py-12 sm:py-16 lg:py-20">
          <div className="space-y-12 sm:space-y-16" style={{ marginTop: "15px" }}>
            {PROCESOS.map((proceso) => (
              <div
                key={proceso.id}
                className={`flex ${
                  proceso.align === "left"
                    ? "justify-start"
                    : "justify-end"
                }`}
              >
                <div
                  ref={(el) => {
                    if (el) cardRefs.current.set(proceso.id, el);
                  }}
                  data-card-id={proceso.id}
                  className={`w-full sm:w-[70%] opacity-0 ${
                    visibleCards.has(proceso.id)
                      ? proceso.align === "left"
                        ? "card-visible-left"
                        : "card-visible-right"
                      : ""
                  }`}
                  style={{
                    overflow: "hidden",
                    borderRadius: 12,
                    border: "1px solid var(--border)",
                    background: "var(--bg-elevated)",
                    boxShadow: "0 16px 48px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.04)",
                    opacity: visibleCards.has(proceso.id) ? 1 : 0,
                    display: "flex",
                    flexDirection: proceso.align === "right" ? "row-reverse" : "row",
                    alignItems: "center",
                    height: 280,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0, padding: "clamp(1.5rem, 3vw, 2rem)" }}>
                    <div
                      style={{
                        fontFamily: "var(--font-geist-mono), monospace",
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: "0.2em",
                        textTransform: "uppercase" as const,
                        color: "var(--accent)",
                        marginBottom: "1rem",
                      }}
                    >
                      {proceso.id}
                    </div>
                    <h3
                      style={{
                        fontFamily: HEADLINE_FONT,
                        fontSize: "clamp(1.1rem, 1.8vw, 1.35rem)",
                        fontWeight: 700,
                        letterSpacing: "-0.02em",
                        lineHeight: 1.25,
                        color: "var(--fg)",
                        margin: "0 0 1rem 0",
                      }}
                    >
                      {proceso.title}
                    </h3>
                    <p
                      style={{
                        fontSize: "0.875rem",
                        lineHeight: 1.7,
                        color: "var(--muted)",
                        margin: 0,
                      }}
                    >
                      {proceso.body}
                    </p>
                  </div>
                  <div
                    style={{
                      width: "50%",
                      flexShrink: 0,
                      alignSelf: "stretch",
                      background: "#0a1628",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <img
                      src={proceso.image}
                      alt={proceso.title}
                      style={{ width: "100%", display: "block" }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
