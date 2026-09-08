"use client";

import { useMemo, useState } from "react";
import { useI18n } from "@/i18n/LocaleContext";
import type { Locale } from "@/i18n/dict";

const MONO = "var(--font-geist-mono), ui-monospace, 'SF Mono', Menlo, monospace";

/** Semanas laborables usadas en la estimación anual. */
const WORK_WEEKS = 47;

const NUM_LOCALE: Record<Locale, string> = {
  es: "es-ES",
  ca: "ca-ES",
  en: "en-GB",
};

type SliderProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (v: number) => void;
};

function Slider({ label, value, min, max, step, unit, onChange }: SliderProps) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <label className="block" style={{ borderTop: "1px solid var(--border-hi)", paddingTop: "1.2rem" }}>
      <div className="flex items-baseline justify-between gap-4 mb-3">
        <span style={{ fontSize: "0.95rem", color: "var(--muted-hi)" }}>{label}</span>
        <span
          style={{
            fontFamily: MONO,
            fontSize: "1rem",
            fontWeight: 600,
            color: "var(--fg)",
            whiteSpace: "nowrap",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {value}
          <span style={{ fontSize: "0.75rem", fontWeight: 400, color: "var(--muted)", marginLeft: "0.35rem" }}>
            {unit}
          </span>
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ "--pct": `${pct}%` } as React.CSSProperties}
      />
    </label>
  );
}

/** Círculo trazado a mano alrededor de la cifra clave. */
function Scribble({ children }: { children: React.ReactNode }) {
  return (
    <span className="relative inline-block">
      <svg
        aria-hidden
        className="absolute pointer-events-none"
        style={{ left: "-7%", top: "-18%", width: "114%", height: "136%", overflow: "visible" }}
        viewBox="0 0 200 80"
        preserveAspectRatio="none"
        fill="none"
      >
        <path
          d="M96 8 C148 4 193 16 194 38 C195 62 148 75 96 74 C48 73 7 62 6 40 C5 18 46 9 102 7 C130 6 150 9 160 13"
          stroke="var(--accent)"
          strokeWidth="2.2"
          strokeLinecap="round"
          opacity="0.9"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      {children}
    </span>
  );
}

function ResultRow({
  label,
  value,
  unit,
  highlight = false,
}: {
  label: string;
  value: string;
  unit: string;
  highlight?: boolean;
}) {
  const figure = (
    <>
      {value}
      <span
        style={{
          fontSize: highlight ? "1.1rem" : "0.85rem",
          fontWeight: 500,
          color: highlight ? "var(--accent)" : "var(--muted)",
          marginLeft: "0.4rem",
          letterSpacing: 0,
        }}
      >
        {unit}
      </span>
    </>
  );
  return (
    <div
      className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-x-6 gap-y-1"
      style={{ borderTop: "1px solid var(--border-hi)", paddingTop: "1.1rem" }}
    >
      <span style={{ fontSize: "0.95rem", color: "var(--muted-hi)" }}>{label}</span>
      <span
        style={{
          fontFamily: MONO,
          fontSize: highlight ? "clamp(2.3rem, 4.4vw, 3.6rem)" : "clamp(1.35rem, 2.4vw, 1.9rem)",
          fontWeight: 600,
          letterSpacing: "-0.04em",
          lineHeight: 1,
          color: highlight ? "var(--accent)" : "var(--fg)",
          fontVariantNumeric: "tabular-nums",
          whiteSpace: "nowrap",
        }}
      >
        {highlight ? <Scribble>{figure}</Scribble> : figure}
      </span>
    </div>
  );
}

export default function RoiCalculator() {
  const { t, locale } = useI18n();
  const [people, setPeople] = useState(4);
  const [hours, setHours] = useState(8);
  const [cost, setCost] = useState(21);
  const [reduction, setReduction] = useState(60);

  const nf = useMemo(
    () => new Intl.NumberFormat(NUM_LOCALE[locale], { maximumFractionDigits: 0 }),
    [locale]
  );

  const yearlyCost = people * hours * cost * WORK_WEEKS;
  const yearlySave = yearlyCost * (reduction / 100);
  const yearlyHours = people * hours * WORK_WEEKS * (reduction / 100);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-y-12 gap-x-16 items-start">
      {/* Controles */}
      <div className="lg:col-span-5 flex flex-col gap-6">
        <Slider
          label={t("v3.calc.fPeople")}
          value={people}
          min={1}
          max={15}
          step={1}
          unit={t("v3.calc.uPeople")}
          onChange={setPeople}
        />
        <Slider
          label={t("v3.calc.fHours")}
          value={hours}
          min={1}
          max={40}
          step={1}
          unit={t("v3.calc.uHours")}
          onChange={setHours}
        />
        <Slider
          label={t("v3.calc.fCost")}
          value={cost}
          min={10}
          max={60}
          step={1}
          unit={t("v3.calc.uCost")}
          onChange={setCost}
        />
        <Slider
          label={t("v3.calc.fReduction")}
          value={reduction}
          min={20}
          max={90}
          step={5}
          unit="%"
          onChange={setReduction}
        />
      </div>

      {/* Resultados: columnas de cifras, sin tarjeta */}
      <div className="lg:col-span-7 flex flex-col gap-7">
        <ResultRow
          label={t("v3.calc.rCost")}
          value={nf.format(yearlyCost)}
          unit={t("v3.calc.perYearMoney")}
        />
        <ResultRow
          label={t("v3.calc.rSave")}
          value={nf.format(yearlySave)}
          unit={t("v3.calc.perYearMoney")}
          highlight
        />
        <ResultRow
          label={t("v3.calc.rHours")}
          value={nf.format(yearlyHours)}
          unit={t("v3.calc.perYearHours")}
        />
      </div>
    </div>
  );
}
