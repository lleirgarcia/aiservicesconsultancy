"use client";

import { useEffect, useMemo, useReducer, useRef } from "react";

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
  "Tenemos página web, pero nadie pide nada por ahí...",
];

const MAX_LINES = 10;
const TYPE_SPEED_MS = 14;
const TYPE_JITTER_MS = 18;
const HOLD_MS = 1000;
// Duración del desvanecimiento verde → blanco tras terminar de escribir.
// Debe ser < HOLD_MS para que la cola llegue a apagarse por completo
// antes de saltar al siguiente slot.
const FADE_MS = 1200;
// Número de caracteres del final que arrastran el tinte verde.
// El último escrito va con la intensidad máxima y se desvanece a blanco
// a medida que se tecleen más letras detrás.
const TAIL_GLOW = 12;

// Cuántas frases se tecleen simultáneamente y cuánto se retrasan entre sí.
// Cada typer arranca desfasado STAGGER_MS respecto al anterior, para evitar
// que letras y pausas caigan sincronizadas.
const TYPER_COUNT = 2;
const STAGGER_MS = 400;

type Phase = "typing" | "holding";

type Typer = {
  slot: number;
  phraseIdx: number;
  typing: string;
  phase: Phase;
};

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
  // Orden inicial aleatorio para que cada carga muestre frases distintas.
  const phrases = useMemo(() => shuffle(PHRASES), []);

  // Historial de texto ya tecleado por slot. Mutado vía ref para evitar
  // renders pesados y sincronizado al DOM con `forceRender` cuando procede.
  const linesRef = useRef<string[]>(Array(MAX_LINES).fill(""));

  // Estado de cada typer (N concurrentes). Se arranca en slots distintos y
  // en frases distintas para evitar colisiones desde el primer frame.
  const typersRef = useRef<Typer[]>(
    Array.from({ length: TYPER_COUNT }, (_, i) => ({
      slot: i,
      phraseIdx: i,
      typing: "",
      phase: "typing" as Phase,
    }))
  );

  // Historial circular de los últimos índices usados. Se usa para evitar
  // repetir frases que aún estén visibles en pantalla.
  const recentIdxRef = useRef<number[]>(
    Array.from({ length: TYPER_COUNT }, (_, i) => i)
  );

  // Un <p> por slot. Animamos --glow directamente sobre el elemento
  // activo para no depender de transiciones CSS sobre custom properties.
  const pRefs = useRef<(HTMLParagraphElement | null)[]>([]);

  const [, forceRender] = useReducer((x: number) => x + 1, 0);

  useEffect(() => {
    let cancelled = false;
    const timers: number[] = [];
    const rafIds: number[] = [];

    const pickNextPhraseIdx = (): number => {
      const recent = new Set(recentIdxRef.current);
      const available: number[] = [];
      for (let i = 0; i < phrases.length; i++) {
        if (!recent.has(i)) available.push(i);
      }
      const pool = available.length > 0 ? available : phrases.map((_, i) => i);
      return pool[Math.floor(Math.random() * pool.length)];
    };

    // Elige el siguiente slot evitando el propio y los que ocupan otros typers.
    // Prioriza slots vacíos mientras queden; si no hay, reutiliza uno libre.
    const pickNextSlot = (idx: number): number => {
      const typers = typersRef.current;
      const occupied = new Set<number>();
      typers.forEach((other, j) => {
        if (j !== idx) occupied.add(other.slot);
      });
      occupied.add(typers[idx].slot);

      const lines = linesRef.current;
      const empty: number[] = [];
      for (let i = 0; i < MAX_LINES; i++) {
        if (!occupied.has(i) && lines[i] === "") empty.push(i);
      }
      if (empty.length > 0) {
        return empty[Math.floor(Math.random() * empty.length)];
      }

      const free: number[] = [];
      for (let i = 0; i < MAX_LINES; i++) {
        if (!occupied.has(i)) free.push(i);
      }
      if (free.length > 0) {
        return free[Math.floor(Math.random() * free.length)];
      }

      // Caso degenerado: todos los slots ocupados por typers activos.
      // Elige cualquiera que no sea el propio para forzar el cambio.
      const fallback: number[] = [];
      for (let i = 0; i < MAX_LINES; i++) {
        if (i !== typers[idx].slot) fallback.push(i);
      }
      return fallback[Math.floor(Math.random() * fallback.length)];
    };

    // Anima --glow de 1 → 0 en el slot recién completado para que el verde
    // residual se desvanezca a blanco durante HOLD_MS.
    const startFade = (slot: number) => {
      const el = pRefs.current[slot];
      if (!el) return;
      const start =
        typeof performance !== "undefined" ? performance.now() : Date.now();
      const anim = (now: number) => {
        if (cancelled) return;
        const tt = Math.min(1, (now - start) / FADE_MS);
        // ease-out cubic
        const eased = 1 - Math.pow(1 - tt, 3);
        el.style.setProperty("--glow", String(1 - eased));
        if (tt < 1) {
          const rid = requestAnimationFrame(anim);
          rafIds.push(rid);
        }
      };
      const rid = requestAnimationFrame(anim);
      rafIds.push(rid);
    };

    const step = (idx: number) => {
      if (cancelled) return;
      const t = typersRef.current[idx];
      const target = phrases[t.phraseIdx];

      // Frase completada: commit + hold + siguiente ciclo.
      if (t.typing.length >= target.length) {
        linesRef.current[t.slot] = target;
        t.phase = "holding";
        forceRender();
        startFade(t.slot);

        const id = window.setTimeout(() => {
          if (cancelled) return;
          const nextSlot = pickNextSlot(idx);
          const nextPhrase = pickNextPhraseIdx();

          const history = recentIdxRef.current;
          history.push(nextPhrase);
          if (history.length > MAX_LINES) history.shift();

          t.slot = nextSlot;
          t.phraseIdx = nextPhrase;
          t.typing = "";
          t.phase = "typing";

          const el = pRefs.current[nextSlot];
          if (el) el.style.setProperty("--glow", "1");

          forceRender();
          step(idx);
        }, HOLD_MS);
        timers.push(id);
        return;
      }

      // Añade la siguiente letra.
      const delay = TYPE_SPEED_MS + Math.random() * TYPE_JITTER_MS;
      const id = window.setTimeout(() => {
        if (cancelled) return;
        t.typing = target.slice(0, t.typing.length + 1);
        forceRender();
        step(idx);
      }, delay);
      timers.push(id);
    };

    // Arranca cada typer con su desfase para que nunca coincidan letra a letra.
    for (let i = 0; i < TYPER_COUNT; i++) {
      const id = window.setTimeout(() => {
        if (cancelled) return;
        const el = pRefs.current[typersRef.current[i].slot];
        if (el) el.style.setProperty("--glow", "1");
        step(i);
      }, STAGGER_MS * i);
      timers.push(id);
    }

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
      rafIds.forEach((id) => cancelAnimationFrame(id));
    };
  }, [phrases]);

  // Mapa slot → typer activo para decidir qué renderizar por línea.
  const activeSlots = new Map<number, Typer>();
  typersRef.current.forEach((t) => {
    activeSlots.set(t.slot, t);
  });

  return (
    <section
      style={{ borderBottom: "1px solid var(--border)" }}
      aria-live="polite"
    >
      <div className="px-5 sm:px-8 py-8 sm:py-10 md:py-14 flex flex-col gap-2">
        {linesRef.current.map((committed, i) => {
          const active = activeSlots.get(i);
          const isActive = active !== undefined;
          // Durante la fase "holding" la frase ya está comprometida; durante
          // "typing" mostramos el texto parcial que lleva escrito.
          const content = isActive ? active!.typing : committed;
          const activeStyle: React.CSSProperties = isActive
            ? { ["--glow" as string]: 1 }
            : {};
          return (
            <p
              key={i}
              ref={(el) => {
                pRefs.current[i] = el;
              }}
              className="pain-line text-[13px] sm:text-sm md:text-base tracking-tight"
              style={{
                lineHeight: "1.5em",
                textAlign: "left",
                fontWeight: 500,
                ...activeStyle,
              }}
            >
              {isActive ? (
                renderActiveLine(content)
              ) : (
                <span>{committed}</span>
              )}
              {isActive && <span className="blinking-cursor" aria-hidden />}
            </p>
          );
        })}
      </div>
    </section>
  );
}
