"use client";

import { useMemo } from "react";
import { useI18n } from "@/i18n/LocaleContext";
import type { Locale } from "@/i18n/dict";
import painListEs from "@/data/painList.es.json";
import painListEn from "@/data/painList.en.json";
import painListCa from "@/data/painList.ca.json";

const PAINS_BY_LOCALE: Record<Locale, string[]> = {
  es: painListEs,
  en: painListEn,
  ca: painListCa,
};

export default function PainList() {
  const { locale, t } = useI18n();
  const pains = useMemo(() => PAINS_BY_LOCALE[locale], [locale]);

  return (
    <section className="px-6 pb-16 max-w-4xl mx-auto">
      <hr className="section-rule mb-10" />

      <p
        className="text-xs font-medium uppercase tracking-widest mb-8"
        style={{ color: "var(--muted)" }}
      >
        {t("sectionPainList.heading")}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-8">
        {pains.map((pain, i) => (
          <div
            key={`${locale}-${i}`}
            className="flex items-baseline gap-2 py-2"
            style={{ borderBottom: "1px solid var(--border)" }}
          >
            <span className="text-xs shrink-0" style={{ color: "var(--border)" }}>
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className="text-sm leading-snug" style={{ color: "var(--muted)" }}>
              {pain}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
