"use client";

import { useEffect, useMemo, useState } from "react";
import Logo from "@/components/ui/Logo";
import { dictionaries, type Locale } from "@/i18n/dict";
import { makeT, langHtml } from "@/lib/i18nT";

const PHONE_DISPLAY = "+34 626 572 151";
const PHONE_TEL = "+34626572151";
const WHATSAPP_URL = "https://wa.me/34626572151";

const HEADLINE_FONT =
  "var(--font-space-grotesk), 'Space Grotesk', system-ui, sans-serif";

function deviceLocale(): Locale {
  const langs = navigator.languages?.length
    ? navigator.languages
    : [navigator.language];
  for (const lang of langs) {
    const base = (lang ?? "").toLowerCase().split("-")[0];
    if (base === "es" || base === "en" || base === "ca") return base;
  }
  return "es";
}

export default function KroomixLinks() {
  const [locale, setLocale] = useState<Locale>("es");

  useEffect(() => {
    const l = deviceLocale();
    setLocale(l);
    document.documentElement.setAttribute("lang", langHtml[l]);
  }, []);

  const t = useMemo(() => makeT(dictionaries[locale]), [locale]);

  const links = [
    {
      href: `tel:${PHONE_TEL}`,
      label: t("links.call"),
      detail: PHONE_DISPLAY,
      external: false,
    },
    {
      href: `${WHATSAPP_URL}?text=${encodeURIComponent(t("contact.waText"))}`,
      label: t("links.wa"),
      detail: t("links.waDetail"),
      external: true,
    },
    {
      href: "/",
      label: t("links.web"),
      detail: t("links.webDetail"),
      external: false,
    },
    {
      href: "/#contacto",
      label: t("links.assistant"),
      detail: t("links.assistantDetail"),
      external: false,
    },
  ];

  return (
    <div
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-5 py-12"
      style={{
        background:
          "linear-gradient(160deg, #0b0f10 0%, #101415 55%, #131a1d 100%)",
        isolation: "isolate",
      }}
    >
      {/* Grid pattern */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          zIndex: -1,
          opacity: 0.035,
          backgroundImage:
            "linear-gradient(var(--accent) 1px, transparent 1px), linear-gradient(90deg, var(--accent) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />
      {/* Radial glow */}
      <div
        className="pointer-events-none absolute"
        style={{
          zIndex: -1,
          top: "-15%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "70vw",
          height: "70vw",
          maxWidth: 600,
          maxHeight: 600,
          background:
            "radial-gradient(circle, rgba(137,206,255,0.07) 0%, transparent 65%)",
          filter: "blur(32px)",
        }}
      />

      <main className="flex w-full max-w-sm flex-col items-center">
        <a href="/" aria-label={t("links.homeAria")} className="mb-2">
          <Logo size={120} />
        </a>

        <p
          className="mb-10 text-center text-sm"
          style={{ color: "var(--muted-hi)", fontFamily: HEADLINE_FONT }}
        >
          {t("links.tagline")}
        </p>

        <nav className="flex w-full flex-col gap-3" aria-label={t("links.nav")}>
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              {...(link.external
                ? { target: "_blank", rel: "noopener noreferrer" }
                : {})}
              className="group flex flex-col gap-1 px-6 py-5 transition-colors"
              style={{
                background: "rgba(16, 20, 21, 0.6)",
                border: "1px solid var(--border)",
                borderRadius: 2,
              }}
            >
              <span
                className="text-xs font-medium uppercase tracking-widest transition-opacity group-hover:opacity-60"
                style={{ color: "var(--accent)", whiteSpace: "nowrap" }}
              >
                {link.label}
              </span>
              <span className="text-sm" style={{ color: "var(--muted)" }}>
                {link.detail}
              </span>
            </a>
          ))}
        </nav>
      </main>
    </div>
  );
}
