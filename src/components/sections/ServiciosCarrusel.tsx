"use client";

import { useState } from "react";
import { motion, AnimatePresence, type Transition } from "framer-motion";

const SERVICIOS = [
  {
    numero: "01",
    nombre: "Operativa interna automatizada",
    problema:
      "«Mis empleados pierden horas en tareas que podría hacer sola la máquina. Pedidos por WhatsApp, Excel que se pasan de mano en mano, procesos que dependen de que alguien esté disponible.»",
    solucion:
      "Automatizamos los flujos repetitivos — validaciones, notificaciones, registros, asignaciones — para que el equipo se centre en lo que aporta valor.",
    etiqueta: "Automatización",
  },
  {
    numero: "02",
    nombre: "Datos conectados",
    problema:
      "«Tengo la información repartida en cinco sitios distintos. El ERP no habla con el CRM, el CRM no habla con las hojas de cálculo, y nadie tiene el dato correcto.»",
    solucion:
      "Integramos tus fuentes de datos en un único flujo limpio y coherente. Un solo sitio donde el dato es fiable.",
    etiqueta: "Integración",
  },
  {
    numero: "03",
    nombre: "Dashboard de gestión",
    problema:
      "«No sé qué está pasando en mi empresa hasta que el problema ya es grande. Me entero de los errores tarde.»",
    solucion:
      "Panel de control con los KPIs que tú eliges, actualizado en tiempo real. Tomas decisiones con datos, no con intuición.",
    etiqueta: "Visibilidad",
  },
  {
    numero: "04",
    nombre: "Página web que vende",
    problema:
      "«Tengo página web pero no genera nada. La gente entra y no compra, no llama, no contacta.»",
    solucion:
      "Rediseñamos con foco en conversión: estructura moderna, chatbot integrado y flujos que guían al usuario hasta la acción.",
    etiqueta: "Conversión",
  },
];

const SPRING: Transition = {
  type: "spring",
  stiffness: 320,
  damping: 28,
  mass: 0.9,
};

export default function ServiciosCarrusel() {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);

  function goTo(index: number) {
    setDirection(index > current ? 1 : -1);
    setCurrent(index);
  }

  function prev() {
    goTo(current === 0 ? SERVICIOS.length - 1 : current - 1);
  }

  function next() {
    goTo(current === SERVICIOS.length - 1 ? 0 : current + 1);
  }

  const servicio = SERVICIOS[current];

  return (
    <div className="px-5 sm:px-8 py-10 sm:py-14" style={{ borderBottom: "1px solid var(--border)" }}>

      {/* Navegación superior */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex gap-2">
          {SERVICIOS.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              style={{
                width: i === current ? 28 : 8,
                height: 8,
                borderRadius: 4,
                background: i === current ? "var(--accent)" : "var(--border)",
                border: "none",
                cursor: "pointer",
                transition: "width 0.3s ease, background 0.3s ease",
                padding: 0,
              }}
              aria-label={`Ir al servicio ${i + 1}`}
            />
          ))}
        </div>
        <div className="flex gap-2">
          <button
            onClick={prev}
            style={{
              background: "transparent",
              border: "1px solid var(--border)",
              borderRadius: 4,
              width: 36,
              height: 36,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "var(--muted)",
              fontSize: 16,
              transition: "border-color 0.15s, color 0.15s",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = "var(--fg)";
              e.currentTarget.style.color = "var(--fg)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = "var(--border)";
              e.currentTarget.style.color = "var(--muted)";
            }}
            aria-label="Anterior"
          >
            ←
          </button>
          <button
            onClick={next}
            style={{
              background: "transparent",
              border: "1px solid var(--border)",
              borderRadius: 4,
              width: 36,
              height: 36,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "var(--muted)",
              fontSize: 16,
              transition: "border-color 0.15s, color 0.15s",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = "var(--fg)";
              e.currentTarget.style.color = "var(--fg)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = "var(--border)";
              e.currentTarget.style.color = "var(--muted)";
            }}
            aria-label="Siguiente"
          >
            →
          </button>
        </div>
      </div>

      {/* Tarjeta con animación */}
      <div style={{ overflow: "hidden", position: "relative", minHeight: 340 }}>
        <AnimatePresence mode="wait" initial={false} custom={direction}>
          <motion.div
            key={current}
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
            style={{ position: "absolute", width: "100%" }}
          >
            <div
              style={{
                border: "1px solid var(--border)",
                borderRadius: 6,
                overflow: "hidden",
              }}
            >
              {/* Cabecera de tarjeta */}
              <div
                style={{
                  borderBottom: "1px solid var(--border)",
                  padding: "20px 24px",
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  gap: 16,
                  background: "var(--bg-section)",
                }}
              >
                <div>
                  <span
                    className="text-xs font-medium uppercase tracking-widest"
                    style={{ color: "var(--accent)" }}
                  >
                    {servicio.etiqueta}
                  </span>
                  <h3 className="text-xl sm:text-2xl font-bold tracking-tight mt-1">
                    {servicio.nombre}
                  </h3>
                </div>
                <span
                  style={{
                    fontFamily: "var(--font-orbitron), monospace",
                    fontSize: 13,
                    color: "var(--border)",
                    letterSpacing: "0.1em",
                    flexShrink: 0,
                  }}
                >
                  {servicio.numero}
                </span>
              </div>

              {/* Cuerpo: problema + solución */}
              <div className="grid sm:grid-cols-2" style={{ minHeight: 200 }}>
                <div
                  style={{
                    padding: "24px",
                    borderRight: "1px solid var(--border)",
                  }}
                >
                  <p
                    className="text-xs font-medium uppercase tracking-widest mb-3"
                    style={{ color: "var(--muted)" }}
                  >
                    El problema
                  </p>
                  <p
                    className="text-sm leading-relaxed"
                    style={{
                      color: "var(--fg)",
                      fontStyle: "italic",
                      opacity: 0.85,
                    }}
                  >
                    {servicio.problema}
                  </p>
                </div>
                <div style={{ padding: "24px" }}>
                  <p
                    className="text-xs font-medium uppercase tracking-widest mb-3"
                    style={{ color: "var(--accent)" }}
                  >
                    La solución
                  </p>
                  <p
                    className="text-sm leading-relaxed"
                    style={{ color: "var(--muted)" }}
                  >
                    {servicio.solucion}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Contador */}
      <div className="mt-4 flex justify-end">
        <span
          className="text-xs"
          style={{
            color: "var(--muted)",
            fontFamily: "var(--font-geist-mono), monospace",
          }}
        >
          {current + 1} / {SERVICIOS.length}
        </span>
      </div>
    </div>
  );
}
