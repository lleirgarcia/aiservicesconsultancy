"use client";

import { useMemo } from "react";
import { useI18n } from "@/i18n/LocaleContext";
import type { Locale } from "@/i18n/dict";
import painGroupsEs from "@/data/painGroups.es.json";
import painGroupsEn from "@/data/painGroups.en.json";
import painGroupsCa from "@/data/painGroups.ca.json";

type PainGroup = { label: string; pains: string[] };
const GROUPS: Record<Locale, PainGroup[]> = {
  es: painGroupsEs,
  en: painGroupsEn,
  ca: painGroupsCa,
};

const FONT_FAMILY =
  "var(--font-space-grotesk), 'Space Grotesk', system-ui, sans-serif";

// Cyclic size/weight/opacity pattern — creates visual rhythm without randomness
const SIZES = [
  { f: "1.5rem",  w: 700, o: 0.5  },
  { f: "0.73rem", w: 400, o: 0.14 },
  { f: "1.05rem", w: 500, o: 0.32 },
  { f: "0.8rem",  w: 400, o: 0.2  },
  { f: "1.25rem", w: 600, o: 0.43 },
  { f: "0.68rem", w: 400, o: 0.12 },
  { f: "0.92rem", w: 500, o: 0.26 },
];

export default function HeroPainCloud() {
  const { locale } = useI18n();
  const pains = useMemo(
    () => GROUPS[locale].flatMap((g) => g.pains),
    [locale]
  );

  return (
    <div
      aria-hidden
      className="flex flex-col overflow-hidden h-full"
      style={{
        gap: "0.5rem",
        maskImage:
          "linear-gradient(to bottom, transparent 0%, #fff 6%, #fff 85%, transparent 100%)",
        WebkitMaskImage:
          "linear-gradient(to bottom, transparent 0%, #fff 6%, #fff 85%, transparent 100%)",
      }}
    >
      {pains.map((pain, i) => {
        const s = SIZES[i % SIZES.length];
        return (
          <p
            key={`${locale}-${i}`}
            style={{
              fontFamily: FONT_FAMILY,
              fontSize: s.f,
              fontWeight: s.w,
              color: "var(--fg)",
              opacity: s.o,
              lineHeight: 1.25,
              letterSpacing: "-0.015em",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              margin: 0,
              flexShrink: 0,
            }}
          >
            {pain}
          </p>
        );
      })}
    </div>
  );
}
