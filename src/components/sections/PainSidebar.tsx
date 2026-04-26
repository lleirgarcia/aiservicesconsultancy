"use client";

import { useMemo } from "react";
import { useI18n } from "@/i18n/LocaleContext";
import type { Locale } from "@/i18n/dict";
import painGroupsEs from "@/data/painGroups.es.json";
import painGroupsEn from "@/data/painGroups.en.json";
import painGroupsCa from "@/data/painGroups.ca.json";

type PainGroup = { label: string; pains: string[] };

const GROUPS_BY_LOCALE: Record<Locale, PainGroup[]> = {
  es: painGroupsEs,
  en: painGroupsEn,
  ca: painGroupsCa,
};

export default function PainSidebar() {
  const { locale } = useI18n();
  const painGroups = useMemo(() => GROUPS_BY_LOCALE[locale], [locale]);
  const maxRows = Math.max(...painGroups.map((g) => g.pains.length));

  return (
    <div
      className="grid"
      style={{
        gridTemplateColumns: "repeat(6, 1fr)",
        gridTemplateRows: `auto repeat(${maxRows}, 1fr)`,
        borderBottom: "1px solid var(--border)",
      }}
    >
      {painGroups.map((group, gi) => (
        <div
          key={`${locale}-h-${gi}`}
          className="px-2 py-1"
          style={{
            borderRight: "1px solid var(--border)",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <p
            className="text-xs font-medium uppercase tracking-widest"
            style={{ color: "var(--foreground)" }}
          >
            {group.label}
          </p>
        </div>
      ))}

      {Array.from({ length: maxRows }, (_, rowIndex) =>
        painGroups.map((group, gi) => (
          <div
            key={`${locale}-${gi}-${rowIndex}`}
            className="px-2 py-1"
            style={{
              borderRight: "1px solid var(--border)",
              borderBottom: "1px solid var(--border)",
            }}
          >
            {group.pains[rowIndex] && (
              <span className="text-xs leading-snug" style={{ color: "var(--muted)" }}>
                {group.pains[rowIndex]}
              </span>
            )}
          </div>
        ))
      )}
    </div>
  );
}
