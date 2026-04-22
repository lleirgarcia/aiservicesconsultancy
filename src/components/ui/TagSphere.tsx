"use client";

import { useEffect, useRef } from "react";

const TAGS = [
  "Pedidos en WhatsApp",
  "Excel desactualizado",
  "Rotura de stock",
  "Facturas a mano",
  "¿Dónde está el envío?",
  "Sin trazabilidad",
  "Cierre de mes caótico",
  "Oportunidades perdidas",
  "Retrabajos constantes",
  "Pipeline en una libreta",
  "Errores de transcripción",
  "Llamadas al transportista",
  "Exceso de inventario",
  "Datos dispersos",
  "Recuentos manuales",
  "Documentos duplicados",
  "Retrasos en cobro",
  "Sin seguimiento",
  "Decisiones a ojo",
  "Incidencias sin gestionar",
  "Horas perdidas",
  "Sin visibilidad",
];

const initPositions = () => {
  const n = TAGS.length;
  return TAGS.map((_, i) => {
    const phi = Math.acos(1 - (2 * (i + 0.5)) / n);
    const theta = Math.PI * (1 + Math.sqrt(5)) * i;
    return {
      x: Math.sin(phi) * Math.cos(theta),
      y: Math.sin(phi) * Math.sin(theta),
      z: Math.cos(phi),
    };
  });
};

function randomTarget() {
  const angle = Math.random() * Math.PI * 2;
  const speed = 0.005 + Math.random() * 0.006;
  return {
    x: Math.sin(angle) * speed * 0.55,
    y: Math.cos(angle) * speed,
  };
}

function wanderFrom(current: { x: number; y: number }) {
  const currentAngle = Math.atan2(current.x, current.y);
  const drift = (Math.random() - 0.5) * Math.PI * 1.1;
  const newAngle = currentAngle + drift;
  const speed = 0.005 + Math.random() * 0.006;
  return {
    x: Math.sin(newAngle) * speed * 0.55,
    y: Math.cos(newAngle) * speed,
  };
}

export default function TagSphere({ size = 380 }: { size?: number }) {
  const containerRef  = useRef<HTMLDivElement>(null);
  const animRef       = useRef<number>(0);
  const speedRef      = useRef(randomTarget());
  const targetRef     = useRef(randomTarget());
  const mouseActiveRef = useRef(false);
  const positions     = useRef(initPositions());

  // Deriva de dirección cada 7-10 s
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    const schedule = () => {
      const delay = 7000 + Math.random() * 3000;
      timer = setTimeout(() => {
        if (!mouseActiveRef.current) {
          targetRef.current = wanderFrom(speedRef.current);
        }
        schedule();
      }, delay);
    };

    schedule();
    return () => clearTimeout(timer);
  }, []);

  // Loop de animación
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const R  = size * 0.4;
    const cx = size / 2;
    const cy = size / 2;

    function tick() {
      // Lerp muy suave — transición lenta y orgánica
      speedRef.current.x += (targetRef.current.x - speedRef.current.x) * 0.007;
      speedRef.current.y += (targetRef.current.y - speedRef.current.y) * 0.007;

      const ax = speedRef.current.x;
      const ay = speedRef.current.y;
      const cosX = Math.cos(ax), sinX = Math.sin(ax);
      const cosY = Math.cos(ay), sinY = Math.sin(ay);

      positions.current.forEach((pos, i) => {
        const x1 = pos.x * cosY - pos.z * sinY;
        const z1 = pos.x * sinY + pos.z * cosY;
        const y1 = pos.y * cosX - z1 * sinX;
        const z2 = pos.y * sinX + z1 * cosX;

        pos.x = x1;
        pos.y = y1;
        pos.z = z2;

        const el = container!.children[i] as HTMLElement;
        if (!el) return;

        const t = (z2 + 1) / 2;

        el.style.transform = `translate(${cx + x1 * R}px, ${cy + y1 * R}px) translate(-50%, -50%)`;
        el.style.opacity    = String(Math.max(0.07, t * 0.95));
        el.style.fontSize   = `${9 + t * 6}px`;
        el.style.fontWeight = t > 0.65 ? "600" : "400";
        el.style.zIndex     = String(Math.round(t * 100));
        el.style.color      = t > 0.72 ? "var(--fg)" : "var(--muted)";
      });

      animRef.current = requestAnimationFrame(tick);
    }

    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
  }, [size]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    mouseActiveRef.current = true;
    const rect = e.currentTarget.getBoundingClientRect();
    const dx = (e.clientX - rect.left  - rect.width  / 2) / (rect.width  / 2);
    const dy = (e.clientY - rect.top   - rect.height / 2) / (rect.height / 2);
    targetRef.current = { x: dy * 0.007, y: dx * 0.007 };
  };

  const handleMouseLeave = () => {
    mouseActiveRef.current = false;
    targetRef.current = wanderFrom(speedRef.current);
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ position: "relative", width: size, height: size, maxWidth: "100%", cursor: "grab" }}
      aria-hidden="true"
    >
      {TAGS.map((tag) => (
        <span
          key={tag}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            whiteSpace: "nowrap",
            userSelect: "none",
            opacity: 0,
            fontFamily: "inherit",
            letterSpacing: "-0.01em",
            lineHeight: 1,
          }}
        >
          {tag}
        </span>
      ))}
    </div>
  );
}
