"use client";

import { useState } from "react";

type LangCode = "ca" | "es" | "en";

const LANGS: { code: LangCode; label: string }[] = [
  { code: "ca", label: "CA" },
  { code: "es", label: "ES" },
  { code: "en", label: "EN" },
];

export default function LanguageSwitcher() {
  const [lang, setLang] = useState<LangCode>("es");

  return (
    <div
      className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest"
      role="group"
      aria-label="Seleccionar idioma"
    >
      {LANGS.map((l, i) => {
        const active = lang === l.code;
        return (
          <div key={l.code} className="flex items-center gap-2">
            {i > 0 && (
              <span aria-hidden style={{ color: "var(--border)" }}>
                ·
              </span>
            )}
            <button
              type="button"
              onClick={() => setLang(l.code)}
              className="transition-opacity hover:opacity-100"
              style={{
                color: active ? "var(--foreground)" : "var(--muted)",
                opacity: active ? 1 : 0.7,
                cursor: "pointer",
                background: "transparent",
                border: "none",
                padding: 0,
              }}
              aria-pressed={active}
              aria-label={`Idioma: ${l.label}`}
            >
              {l.label}
            </button>
          </div>
        );
      })}
    </div>
  );
}
