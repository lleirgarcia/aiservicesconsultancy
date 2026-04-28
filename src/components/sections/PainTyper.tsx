"use client";

import { useEffect, useMemo, useReducer, useRef } from "react";
import { useI18n } from "@/i18n/LocaleContext";
import type { Locale } from "@/i18n/dict";
import painPhrasesEs from "@/data/painPhrases.es.json";
import painPhrasesEn from "@/data/painPhrases.en.json";
import painPhrasesCa from "@/data/painPhrases.ca.json";

const PAIN_BY_LOCALE: Record<Locale, string[]> = {
  es: painPhrasesEs,
  en: painPhrasesEn,
  ca: painPhrasesCa,
};

const MAX_LINES = 10;
const TYPE_SPEED_MS = 14;
const TYPE_JITTER_MS = 18;
const HOLD_MS = 1000;
const FADE_MS = 1200;
const TAIL_GLOW = 12;
const TYPER_COUNT = 2;
const STAGGER_MS = 400;

/** All 10 values must be unique so no two lines share the same start edge (bare/hero) */
const SLOT_INDENT = [
  "0%",
  "7.5%",
  "3.2%",
  "11.5%",
  "1.1%",
  "9.2%",
  "4.5%",
  "6.1%",
  "2.3%",
  "8.1%",
] as const;

const SLOT_MARGIN_TOP = [
  "0",      "1.6rem", "0.3rem", "2.4rem", "0.5rem",
  "1.9rem", "0.2rem", "1.1rem", "2.8rem", "0.7rem",
];

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
        const distFromEnd = tail.length - 1 - i;
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

export default function PainTyper({ bare = false }: { bare?: boolean }) {
  const { locale } = useI18n();
  const phrases = useMemo(
    () => shuffle(PAIN_BY_LOCALE[locale]),
    [locale]
  );

  const linesRef = useRef<string[]>(Array(MAX_LINES).fill(""));

  const typersRef = useRef<Typer[]>(
    Array.from({ length: TYPER_COUNT }, (_, i) => ({
      slot: i,
      phraseIdx: i,
      typing: "",
      phase: "typing" as Phase,
    }))
  );

  const recentIdxRef = useRef<number[]>(
    Array.from({ length: TYPER_COUNT }, (_, i) => i)
  );

  const pRefs = useRef<(HTMLParagraphElement | null)[]>([]);

  const [, forceRender] = useReducer((x: number) => x + 1, 0);

  useEffect(() => {
    linesRef.current = Array(MAX_LINES).fill("");
    typersRef.current = Array.from({ length: TYPER_COUNT }, (_, i) => ({
      slot: i,
      phraseIdx: i,
      typing: "",
      phase: "typing" as Phase,
    }));
    recentIdxRef.current = Array.from(
      { length: TYPER_COUNT },
      (_, i) => i
    );
    pRefs.current.forEach((el) => {
      if (el) el.style.setProperty("--glow", "1");
    });
    forceRender();

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

      const fallback: number[] = [];
      for (let i = 0; i < MAX_LINES; i++) {
        if (i !== typers[idx].slot) fallback.push(i);
      }
      return fallback[Math.floor(Math.random() * fallback.length)];
    };

    const startFade = (slot: number) => {
      const el = pRefs.current[slot];
      if (!el) return;
      const start =
        typeof performance !== "undefined" ? performance.now() : Date.now();
      const anim = (now: number) => {
        if (cancelled) return;
        const tt = Math.min(1, (now - start) / FADE_MS);
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

      const delay = TYPE_SPEED_MS + Math.random() * TYPE_JITTER_MS;
      const id = window.setTimeout(() => {
        if (cancelled) return;
        t.typing = target.slice(0, t.typing.length + 1);
        forceRender();
        step(idx);
      }, delay);
      timers.push(id);
    };

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

  const activeSlots = new Map<number, Typer>();
  typersRef.current.forEach((t) => {
    activeSlots.set(t.slot, t);
  });

  const Wrapper = bare ? "div" : "section";

  return (
    <Wrapper
      style={bare ? {} : { borderBottom: "1px solid var(--border)" }}
      aria-live="polite"
    >
      <div className={bare ? "flex flex-col" : "px-5 sm:px-8 py-8 sm:py-10 md:py-14 flex flex-col gap-2"}>
        {linesRef.current.map((committed, i) => {
          const active = activeSlots.get(i);
          const isActive = active !== undefined;
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
                paddingLeft: bare ? (SLOT_INDENT[i] ?? "0") : undefined,
                marginTop: bare ? SLOT_MARGIN_TOP[i] : undefined,
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
    </Wrapper>
  );
}
