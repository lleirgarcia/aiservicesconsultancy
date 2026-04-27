"use client";

import PainTyper from "@/components/sections/PainTyper";
import QuienesSomos from "@/components/sections/QuienesSomos";
import ServiciosCarrusel from "@/components/sections/ServiciosCarrusel";
import ChatAgent from "@/components/sections/ChatAgent";
import Footer from "@/components/sections/Footer";
import Logo from "@/components/ui/Logo";
import ContactTrigger from "@/components/ui/ContactTrigger";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";
import { useI18n } from "@/i18n/LocaleContext";

const HEADLINE_FONT = "var(--font-space-grotesk), 'Space Grotesk', system-ui, sans-serif";

export default function Home() {
  const { t } = useI18n();

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>

      {/* ── Header ─────────────────────────────────────── */}
      <header
        className="sticky top-0 z-50 w-full"
        style={{
          background: "rgba(16, 20, 21, 0.88)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div className="max-w-[1280px] mx-auto px-6 sm:px-8 h-16 sm:h-[72px] flex items-center justify-between gap-4">
          <a href="/" aria-label={t("header.homeAria")} className="inline-flex shrink-0">
            <Logo />
          </a>
          <div className="flex items-center gap-3 sm:gap-4">
            <ContactTrigger />
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────── */}
      <section
        className="relative flex items-center overflow-hidden"
        style={{
          minHeight: "88vh",
          background: "linear-gradient(160deg, #0b0f10 0%, #101415 55%, #131a1d 100%)",
        }}
      >
        {/* Grid pattern */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            opacity: 0.035,
            backgroundImage:
              "linear-gradient(var(--accent) 1px, transparent 1px), linear-gradient(90deg, var(--accent) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />
        {/* Radial glow top-left */}
        <div
          className="absolute pointer-events-none"
          style={{
            top: "-10%",
            left: "-5%",
            width: "60vw",
            height: "60vw",
            maxWidth: 700,
            maxHeight: 700,
            background: "radial-gradient(circle, rgba(137,206,255,0.07) 0%, transparent 65%)",
            filter: "blur(32px)",
          }}
        />
        {/* Radial glow bottom-right */}
        <div
          className="absolute pointer-events-none"
          style={{
            bottom: "0",
            right: "5%",
            width: "40vw",
            height: "40vw",
            maxWidth: 500,
            maxHeight: 500,
            background: "radial-gradient(circle, rgba(137,206,255,0.04) 0%, transparent 70%)",
            filter: "blur(40px)",
          }}
        />

        <div className="relative z-10 max-w-[1280px] mx-auto px-6 sm:px-8 w-full py-20 sm:py-28">
          {/* Eyebrow label */}
          <div
            className="inline-flex items-center gap-3 mb-8"
            style={{
              borderLeft: "2px solid var(--accent)",
              paddingLeft: "0.85rem",
            }}
          >
            <span
              style={{
                fontFamily: HEADLINE_FONT,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "var(--accent)",
              }}
            >
              Kroomix · Osona
            </span>
          </div>

          {/* Main headline */}
          <h1
            style={{
              fontFamily: HEADLINE_FONT,
              fontSize: "clamp(2.6rem, 6.5vw, 5.5rem)",
              fontWeight: 700,
              letterSpacing: "-0.025em",
              lineHeight: 1.04,
              color: "var(--fg)",
              marginBottom: "clamp(1rem, 3vw, 2rem)",
              maxWidth: "14ch",
            }}
          >
            {t("hero.h1")}
          </h1>

          {/* Sub-items */}
          <div className="flex flex-col gap-2 mb-10 sm:mb-14">
            {[t("hero.sub1"), t("hero.sub2"), t("hero.sub3")].map((line, i) => (
              <div key={i} className="flex items-baseline gap-3">
                <span
                  style={{
                    fontFamily: "var(--font-geist-mono), monospace",
                    fontSize: 11,
                    fontWeight: 700,
                    color: "var(--accent)",
                    opacity: 1 - i * 0.2,
                    minWidth: 18,
                  }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span
                  style={{
                    fontFamily: HEADLINE_FONT,
                    fontSize: "clamp(1.1rem, 2.5vw, 1.6rem)",
                    fontWeight: 500,
                    letterSpacing: "-0.01em",
                    color: i === 0 ? "var(--muted-hi)" : "var(--muted)",
                    lineHeight: 1.3,
                  }}
                >
                  {line}
                </span>
              </div>
            ))}
          </div>

          {/* Divider line */}
          <div
            style={{
              width: "clamp(60px, 8vw, 100px)",
              height: 1,
              background: "linear-gradient(90deg, var(--accent) 0%, transparent 100%)",
              opacity: 0.5,
            }}
          />
        </div>

        {/* Bottom edge fade */}
        <div
          className="absolute bottom-0 left-0 right-0 pointer-events-none"
          style={{
            height: 120,
            background: "linear-gradient(to bottom, transparent, var(--bg))",
          }}
        />
      </section>

      {/* ── PainTyper ───────────────────────────────────── */}
      <div style={{ borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
        <PainTyper />
      </div>

      {/* ── Soluciones — header ─────────────────────────── */}
      <div
        style={{
          borderBottom: "1px solid var(--border)",
          background: "var(--bg-section)",
        }}
      >
        <div className="max-w-[1280px] mx-auto px-6 sm:px-8 py-12 sm:py-16">
          <span
            style={{
              display: "block",
              fontFamily: "var(--font-inter), system-ui, sans-serif",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "var(--accent)",
              marginBottom: "1rem",
              paddingLeft: "0.85rem",
              borderLeft: "2px solid var(--accent)",
            }}
          >
            {t("sectionSolution.subtitle")}
          </span>
          <h2
            style={{
              fontFamily: HEADLINE_FONT,
              fontSize: "clamp(1.8rem, 4vw, 3rem)",
              fontWeight: 700,
              letterSpacing: "-0.02em",
              lineHeight: 1.1,
              color: "var(--fg)",
            }}
          >
            {t("sectionSolution.title")}
          </h2>
        </div>
      </div>

      {/* ── Carrusel de servicios ───────────────────────── */}
      <div className="max-w-[1280px] mx-auto">
        <ServiciosCarrusel />
      </div>

      {/* ── Quiénes somos ───────────────────────────────── */}
      <div style={{ borderTop: "1px solid var(--border)" }}>
        <div className="max-w-[1280px] mx-auto">
          <QuienesSomos />
        </div>
      </div>

      {/* ── CTA — header ────────────────────────────────── */}
      <div
        style={{
          borderTop: "1px solid var(--border)",
          borderBottom: "1px solid var(--border)",
          background: "var(--bg-section)",
        }}
      >
        <div className="max-w-[1280px] mx-auto px-6 sm:px-8 py-12 sm:py-16">
          <span
            style={{
              display: "block",
              fontFamily: "var(--font-inter), system-ui, sans-serif",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "var(--accent)",
              marginBottom: "1rem",
              paddingLeft: "0.85rem",
              borderLeft: "2px solid var(--accent)",
            }}
          >
            {t("sectionCta.subtitle")}
          </span>
          <h2
            style={{
              fontFamily: HEADLINE_FONT,
              fontSize: "clamp(1.8rem, 4vw, 3rem)",
              fontWeight: 700,
              letterSpacing: "-0.02em",
              lineHeight: 1.1,
              color: "var(--fg)",
            }}
          >
            {t("sectionCta.title")}
          </h2>
        </div>
      </div>

      {/* ── Chat ────────────────────────────────────────── */}
      <div className="max-w-[1280px] mx-auto">
        <ChatAgent />
      </div>

      {/* ── Footer ──────────────────────────────────────── */}
      <div style={{ borderTop: "1px solid var(--border)" }}>
        <div className="max-w-[1280px] mx-auto">
          <Footer />
        </div>
      </div>

    </div>
  );
}
