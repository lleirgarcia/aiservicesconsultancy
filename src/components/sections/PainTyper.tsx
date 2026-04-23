"use client";

import { useEffect, useMemo, useRef, useState } from "react";

/**
 * Frases que podría decir el jefe/dueño en su día a día.
 * Cada frase deriva de un pain real (ver ideas/tabla-pains-como-frases.md).
 */
const PHRASES: string[] = [
  "¿Por qué tenemos que meter esto a mano dos veces?...",
  "Llevamos tres horas metiendo facturas y aún no hemos terminado...",
  "¿Hay alguna forma de no tener que leer estos PDFs uno a uno?...",
  "Depende de dónde mires, el número es distinto...",
  "¿De qué Excel me tengo que fiar?...",
  "Eso está en el email de Pedro, o quizás en el WhatsApp...",
  "¿Cuánto hemos facturado este mes, realmente?...",
  "Con este cliente trabajamos mucho, pero no sé si nos sale a cuenta...",
  "En algún sitio se nos está yendo el dinero y no sé dónde...",
  "Esta factura lleva 90 días y nadie la ha reclamado...",
  "A final de mes siempre vamos justos, aunque estemos vendiendo bien...",
  "No sé si contratar a alguien o comprar una máquina...",
  "Tengo gente cara haciendo cosas que podría hacer una máquina...",
  "Nadie quiere hacer este trabajo y los que vienen no duran...",
  "Si yo no estoy, esto no funciona...",
  "Sé que hay que cambiarlo, pero nunca hay momento...",
  "Lo propongo y siempre hay una excusa para no hacerlo...",
  "Ya es la tercera vez este mes que sale mal lo mismo...",
  "¿Alguien ha confirmado el pedido de ayer?...",
  "Nos pidieron presupuesto y, cuando contestamos, ya habían ido a otro...",
  "Ese email se quedó sin responder y el cliente se mosqueó...",
  "El cliente lleva dos días esperando y nadie le ha dado respuesta...",
  "Ese cliente podría haber comprado más y no lo vimos...",
  "¿Con quién habló María la semana pasada? No tengo ni idea...",
  "No tengo forma de saber cómo va el mes hasta que acaba...",
  "Trabajo mucho, pero no sé quién está rindiendo y quién no...",
  "Solo Joan sabe cómo se hace esto, y Joan está de vacaciones...",
  "El programa de almacén y el de ventas no se hablan...",
  "Si crecemos un 20% más, no sé cómo lo vamos a gestionar...",
  "Me entero de los problemas cuando ya es demasiado tarde...",
  "Esto se podría automatizar, pero nadie sabe cómo...",
  "Seguimos con el Excel de 2015 y nadie se atreve a cambiarlo...",
  "Siempre lo hemos hecho así y funciona, más o menos...",
  "Eso de la IA está bien para las grandes, nosotros somos pequeños...",
  "He visto demos, pero no tengo ni idea de por dónde empezar...",
];

const MAX_LINES = 10;
const TYPE_SPEED_MS = 14;
const TYPE_JITTER_MS = 18;
const HOLD_MS = 1800;
// Duración del desvanecimiento verde → blanco tras terminar de escribir.
// Debe ser < HOLD_MS para que la cola llegue a apagarse por completo
// antes de saltar al siguiente slot.
const FADE_MS = 1200;
// Número de caracteres del final que arrastran el tinte verde.
// El último escrito va con la intensidad máxima y se desvanece a blanco
// a medida que se tecleen más letras detrás.
const TAIL_GLOW = 12;

type Phase = "typing" | "holding";

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Renderiza la línea que se está tecleando: la cabecera en color normal
 * y los últimos TAIL_GLOW caracteres con un degradado hacia el verde de
 * acento. El último escrito es el más verde y se va desvaneciendo hacia
 * blanco a medida que se escriben más letras detrás de él.
 *
 * Cada letra multiplica su intensidad por var(--glow), una custom
 * property que el componente anima manualmente vía requestAnimationFrame.
 * Mientras se teclea vale 1; al terminar la frase (fase "holding") se
 * interpola hasta 0, de forma que el tinte verde se desvanece de manera
 * suave hacia blanco a lo largo de FADE_MS.
 */
function renderActiveLine(text: string) {
  const len = text.length;
  if (len === 0) return null;
  const tailStart = Math.max(0, len - TAIL_GLOW);
  const head = text.slice(0, tailStart);
  const tail = text.slice(tailStart);
  return (
    <>
      {head && <span>{head}</span>}
      {Array.from(tail).map((ch, i) => {
        // Distancia al final del texto: 0 = recién escrito (más verde).
        const distFromEnd = tail.length - 1 - i;
        // Intensidad base en %: 100 para el último, decreciendo hasta 0.
        const pct = Math.max(0, 100 - (distFromEnd * 100) / TAIL_GLOW);
        return (
          <span
            key={`${len}-${i}`}
            style={{
              color: `color-mix(in srgb, var(--accent) calc(${pct}% * var(--glow)), var(--fg))`,
            }}
          >
            {ch}
          </span>
        );
      })}
    </>
  );
}

export default function PainTyper() {
  const phrases = useMemo(() => shuffle(PHRASES), []);
  // Líneas fijas ya tecleadas completamente (FIFO circular por índice).
  const [lines, setLines] = useState<string[]>(() => Array(MAX_LINES).fill(""));
  // Marca si la línea ya ha sido sobrescrita al menos una vez (ciclo >=2 => bold).
  const [bold, setBold] = useState<boolean[]>(() => Array(MAX_LINES).fill(false));
  // Slot que se está tecleando ahora mismo.
  const [activeSlot, setActiveSlot] = useState(0);
  // Índice dentro del array de frases (avanza secuencialmente).
  const [phraseIdx, setPhraseIdx] = useState(0);
  // Nº de ciclo completo (0 = primera pasada rellenando, 1+ = sobrescribiendo).
  const [cycle, setCycle] = useState(0);
  // Texto que se está tecleando en el slot activo.
  const [typing, setTyping] = useState("");
  const [phase, setPhase] = useState<Phase>("typing");
  // Un <p> por slot. Animamos --glow directamente sobre el elemento
  // activo para no depender de transiciones CSS sobre custom properties
  // (que requieren @property y no son fiables entre motores).
  const pRefs = useRef<(HTMLParagraphElement | null)[]>([]);

  // Tecleo letra a letra.
  useEffect(() => {
    if (phase !== "typing") return;
    const target = phrases[phraseIdx];
    if (typing.length >= target.length) {
      setLines((prev) => {
        const next = prev.slice();
        next[activeSlot] = target;
        return next;
      });
      const shouldBold = cycle % 2 === 1;
      setBold((prev) => {
        if (prev[activeSlot] === shouldBold) return prev;
        const next = prev.slice();
        next[activeSlot] = shouldBold;
        return next;
      });
      setPhase("holding");
      return;
    }
    const delay = TYPE_SPEED_MS + Math.random() * TYPE_JITTER_MS;
    const id = setTimeout(() => {
      setTyping(target.slice(0, typing.length + 1));
    }, delay);
    return () => clearTimeout(id);
  }, [phase, typing, phraseIdx, activeSlot, phrases, cycle]);

  // Fade manual de --glow (1 → 0) al terminar de escribir.
  // Actualizamos la custom property vía rAF en lugar de confiar en
  // `transition: --glow …`, que depende de @property y no anima
  // consistentemente cuando React reescribe el style inline.
  useEffect(() => {
    const el = pRefs.current[activeSlot];
    if (!el) return;
    if (phase === "typing") {
      el.style.setProperty("--glow", "1");
      return;
    }
    const start =
      typeof performance !== "undefined" ? performance.now() : Date.now();
    let rafId = 0;
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / FADE_MS);
      // ease-out cubic: se desvanece rápido al principio y se va suavizando.
      const eased = 1 - Math.pow(1 - t, 3);
      el.style.setProperty("--glow", String(1 - eased));
      if (t < 1) rafId = requestAnimationFrame(step);
    };
    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [phase, activeSlot]);

  // Pausa y salto al siguiente slot.
  useEffect(() => {
    if (phase !== "holding") return;
    const id = setTimeout(() => {
      setTyping("");
      setActiveSlot((s) => {
        const nextSlot = (s + 1) % MAX_LINES;
        if (nextSlot === 0) setCycle((c) => c + 1);
        return nextSlot;
      });
      setPhraseIdx((p) => (p + 1) % phrases.length);
      setPhase("typing");
    }, HOLD_MS);
    return () => clearTimeout(id);
  }, [phase, phrases.length]);

  return (
    <section
      style={{ borderBottom: "1px solid var(--border)" }}
      aria-live="polite"
    >
      <div className="px-8 py-10 md:py-14 flex flex-col gap-2">
      {lines.map((committed, i) => {
        const isActive = i === activeSlot;
        const content = isActive ? typing : committed;
        // Alternancia por vuelta: ciclos impares en bold, ciclos pares en normal.
        // El slot activo adopta ya el peso del ciclo actual mientras se teclea.
        const isBold = isActive ? cycle % 2 === 1 : bold[i];
        // --glow se inicializa a 1 para el slot activo. La animación
        // (useEffect arriba) lo baja a 0 cuando termina la frase.
        const activeStyle: React.CSSProperties = isActive
          ? { ["--glow" as string]: 1 }
          : {};
        return (
          <p
            key={i}
            ref={(el) => {
              pRefs.current[i] = el;
            }}
            className="text-sm md:text-base leading-snug tracking-tight"
            style={{
              minHeight: "1.3em",
              textAlign: "left",
              fontWeight: isBold ? 600 : 500,
              ...activeStyle,
            }}
          >
            {isActive ? renderActiveLine(content) : <span>{content}</span>}
            {isActive && <span className="blinking-cursor" aria-hidden />}
          </p>
        );
      })}
      </div>
    </section>
  );
}
