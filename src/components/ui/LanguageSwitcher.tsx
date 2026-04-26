"use client";

import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/i18n/LocaleContext";
import type { Locale } from "@/i18n/dict";

const LANGS: { code: Locale; label: string }[] = [
  { code: "ca", label: "CA" },
  { code: "es", label: "ES" },
  { code: "en", label: "EN" },
];

export default function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const activeLabel = LANGS.find((l) => l.code === locale)?.label ?? "ES";

  return (
    <>
      <div className="relative sm:hidden" ref={wrapRef}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-1 text-xs font-medium uppercase tracking-widest cursor-pointer transition-opacity hover:opacity-80"
          style={{
            background: "transparent",
            border: "none",
            padding: 0,
            color: "var(--foreground)",
          }}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label={t("header.langGroup")}
        >
          <span>{activeLabel}</span>
          <svg
            width="10"
            height="10"
            viewBox="0 0 10 10"
            aria-hidden
            style={{
              transition: "transform 0.15s",
              transform: open ? "rotate(180deg)" : "rotate(0deg)",
            }}
          >
            <path
              d="M2 4l3 3 3-3"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {open && (
          <ul
            role="listbox"
            aria-label={t("header.langGroup")}
            className="absolute right-0 mt-2 min-w-[80px]"
            style={{
              background: "var(--bg)",
              border: "1px solid var(--border)",
              borderRadius: 2,
              boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
              zIndex: 40,
              padding: "4px 0",
            }}
          >
            {LANGS.map((l) => {
              const active = locale === l.code;
              return (
                <li key={l.code} role="option" aria-selected={active}>
                  <button
                    type="button"
                    onClick={() => {
                      setLocale(l.code);
                      setOpen(false);
                    }}
                    className="w-full text-left text-xs font-medium uppercase tracking-widest cursor-pointer transition-opacity hover:opacity-80"
                    style={{
                      background: "transparent",
                      border: "none",
                      padding: "8px 14px",
                      color: active ? "var(--foreground)" : "var(--muted)",
                    }}
                  >
                    {l.label}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div
        className="hidden sm:flex items-center gap-2 text-xs font-medium uppercase tracking-widest"
        role="group"
        aria-label={t("header.langGroup")}
      >
        {LANGS.map((l, i) => {
          const active = locale === l.code;
          return (
            <div key={l.code} className="flex items-center gap-2">
              {i > 0 && (
                <span aria-hidden style={{ color: "var(--border)" }}>
                  ·
                </span>
              )}
              <button
                type="button"
                onClick={() => setLocale(l.code)}
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
                aria-label={`${t("header.langGroup")}: ${l.label}`}
              >
                {l.label}
              </button>
            </div>
          );
        })}
      </div>
    </>
  );
}
