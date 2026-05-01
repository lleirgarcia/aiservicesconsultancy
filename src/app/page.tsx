"use client";

import { useCallback } from "react";
import PainTyper from "@/components/sections/PainTyper";
import QuienesSomos from "@/components/sections/QuienesSomos";
import ComoTrabajamos from "@/components/sections/ComoTrabajamos";
import ComoLoHacemos from "@/components/sections/ComoLoHacemos";
import ServiciosCarrusel from "@/components/sections/ServiciosCarrusel";
import TresPilares from "@/components/sections/TresPilares";
import QueOfrecemos from "@/components/sections/QueOfrecemos";
import ChatAgent from "@/components/sections/ChatAgent";
import Footer from "@/components/sections/Footer";
import Logo from "@/components/ui/Logo";
import ContactTrigger from "@/components/ui/ContactTrigger";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";
import SectionHeader from "@/components/ui/SectionHeader";
import { useI18n } from "@/i18n/LocaleContext";

const HEADLINE_FONT = "var(--font-space-grotesk), 'Space Grotesk', system-ui, sans-serif";

const HEADER_OFFSET_PX = 64; /* h-16 */
const HEADER_OFFSET_SM_PX = 72; /* sm:h-[72px] */
const SCROLL_TO_SOLUCIONES_MS = 350;

function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/** Slow eased scroll; respects reduced motion. */
function scrollToIdSlow(id: string) {
  if (typeof window === "undefined") return;
  const el = document.getElementById(id);
  if (!el) return;
  const headerOff =
    window.matchMedia("(min-width: 640px)").matches
      ? HEADER_OFFSET_SM_PX
      : HEADER_OFFSET_PX;
  const yTarget =
    el.getBoundingClientRect().top + window.scrollY - headerOff;
  const y0 = window.scrollY;
  const delta = yTarget - y0;
  if (Math.abs(delta) < 1) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    window.scrollTo(0, yTarget);
    return;
  }
  const t0 = performance.now();
  const tick = (now: number) => {
    const u = Math.min(1, (now - t0) / SCROLL_TO_SOLUCIONES_MS);
    const eased = easeInOutCubic(u);
    window.scrollTo(0, y0 + delta * eased);
    if (u < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

export default function Home() {
  const { t } = useI18n();
  const onDiscoverSoluciones = useCallback(() => {
    scrollToIdSlow("soluciones");
  }, []);

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
          overflow: "visible",
        }}
      >
        <div className="max-w-[1280px] mx-auto px-6 sm:px-8 h-16 sm:h-[72px] flex items-center justify-between gap-4 overflow-visible">
          <a href="/" aria-label={t("header.homeAria")} className="inline-flex shrink-0" style={{ marginTop: "7px", marginBottom: "9px" }}>
            <Logo />
          </a>
          <div className="flex items-center gap-3 sm:gap-4">
            <a
              href="/blog"
              className="text-xs font-medium uppercase tracking-widest transition-opacity hover:opacity-60"
              style={{ color: "var(--muted)" }}
            >
              {t("blog.list.title")}
            </a>
            <ContactTrigger />
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────── */}
      <section
        className="relative flex min-h-0 flex-col overflow-x-clip hero-viewport"
        style={{
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

        <div className="relative z-10 flex min-h-0 flex-1 flex-col justify-center">
          <div className="max-w-[1280px] mx-auto w-full px-5 sm:px-8 py-[clamp(1rem,3dvh,1.75rem)] sm:py-[clamp(1.25rem,4dvh,2.5rem)]">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-y-10 gap-x-6 lg:gap-x-8 xl:gap-x-10 lg:items-start w-full">
            {/* Primary column — narrower on lg+ so the pain list has more width */}
            <div className="lg:col-span-5 min-w-0">
              <h1
                style={{
                  fontFamily: HEADLINE_FONT,
                  fontSize: "clamp(1.85rem, 5.2vw + 0.5rem, 5.5rem)",
                  fontWeight: 700,
                  letterSpacing: "-0.025em",
                  lineHeight: 1.04,
                  color: "var(--fg)",
                  marginBottom: "clamp(0.75rem, 2.5dvh, 2rem)",
                  maxWidth: "min(100%, 14ch)",
                }}
              >
                {t("hero.h1")}
              </h1>

              <div className="flex flex-col gap-1.5 sm:gap-2 mb-6 sm:mb-10 lg:mb-14">
                {[t("hero.sub1"), t("hero.sub2"), t("hero.sub3")].map((line, i) => {
                  const chevronOpac = [0.5, 0.78, 1][i] ?? 1;
                  const isPayoff = i === 2;
                  return (
                  <div key={i} className="flex items-baseline gap-2 sm:gap-3">
                    <span
                      style={{
                        fontFamily: "var(--font-space-grotesk), 'Space Grotesk', system-ui, sans-serif",
                        fontSize: "clamp(11px, 2.2vw, 13px)",
                        fontWeight: 700,
                        color: "var(--accent)",
                        opacity: chevronOpac,
                        minWidth: "1em",
                        letterSpacing: "-0.04em",
                      }}
                    >
                      »
                    </span>
                    <span
                      style={{
                        fontFamily: HEADLINE_FONT,
                        fontSize: isPayoff
                          ? "clamp(1.02rem, 1.95vw + 0.4rem, 1.68rem)"
                          : "clamp(0.95rem, 1.8vw + 0.35rem, 1.5rem)",
                        fontWeight: isPayoff ? 600 : 500,
                        letterSpacing: "-0.01em",
                        color: isPayoff
                          ? "var(--fg)"
                          : i === 0
                            ? "var(--muted)"
                            : "var(--muted-hi)",
                        lineHeight: 1.3,
                      }}
                    >
                      {line}
                    </span>
                  </div>
                );
                })}
              </div>

              <div
                style={{
                  width: "clamp(60px, 8vw, 100px)",
                  height: 1,
                  background: "linear-gradient(90deg, var(--accent) 0%, transparent 100%)",
                  opacity: 0.5,
                }}
              />
            </div>

            {/* Pain list — wider column (7/12) + taller box for readable lines */}
            <div
              className="lg:col-span-7 min-w-0 overflow-hidden lg:pt-[clamp(0.5rem,4dvh,2rem)]"
              style={{
                height: "clamp(360px, 58vh, 600px)",
                maskImage:
                  "linear-gradient(to bottom, transparent 0%, #fff 8%, #fff 90%, transparent 100%)",
                WebkitMaskImage:
                  "linear-gradient(to bottom, transparent 0%, #fff 8%, #fff 90%, transparent 100%)",
              }}
            >
              <div className="lg:pl-8 xl:pl-14 lg:pr-0 h-full min-w-0">
                <PainTyper bare />
              </div>
            </div>
            </div>
          </div>
        </div>

        <div
          className="relative z-20 hidden w-full flex-shrink-0 justify-center px-4 pb-7 pt-2 sm:flex sm:pb-9"
        >
          <button
            type="button"
            className="cta-discover"
            onClick={onDiscoverSoluciones}
          >
            {t("hero.discoverCta")}
            <svg
              className="cta-discover-chevron"
              width={18}
              height={18}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.25}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
        </div>

        {/* Bottom edge fade */}
        <div
          className="pointer-events-none absolute bottom-0 left-0 right-0"
          style={{
            height: 120,
            background: "linear-gradient(to bottom, transparent, var(--bg))",
            zIndex: 10,
          }}
        />
      </section>

      {/* ── Soluciones — header (target #soluciones) ────────────────── */}
      <div
        id="soluciones"
        className="scroll-mt-16 sm:scroll-mt-[4.5rem]"
        style={{
          borderBottom: "1px solid var(--border)",
          background: "var(--bg-section)",
        }}
      >
        <div className="max-w-[1280px] mx-auto px-6 sm:px-8 py-8 sm:py-10">
          <SectionHeader
            title={t("sectionSolution.heading")}
            subtitle={t("sectionSolution.rightPlace")}
          />
        </div>
      </div>

      {/* ── Tres pilares flotantes ──────────────────────── */}
      <TresPilares />

      {/* ── Qué ofrecemos (servicios) ───────────────────── */}
      <div style={{ marginTop: "clamp(3rem, 6vh, 5rem)" }}>
        <QueOfrecemos />
      </div>

      {/* ── Cómo lo hacemos ─────────────────────────────── */}
      <div style={{ marginTop: "clamp(3rem, 6vh, 5rem)" }}>
        <ComoLoHacemos />
      </div>

      {/* ── Carrusel de servicios (full-width header rule; body max-w inside component) ── */}
      <div style={{ marginTop: "clamp(3rem, 6vh, 5rem)" }}>
        <ServiciosCarrusel />
      </div>

      {/* ── Cómo trabajamos ─────────────────────────────── */}
      <div style={{ marginTop: "clamp(3rem, 6vh, 5rem)" }}>
        <ComoTrabajamos />
      </div>

      {/* ── Quiénes somos ───────────────────────────────── */}
      <div style={{ marginTop: "clamp(3rem, 6vh, 5rem)" }}>
        <QuienesSomos />
      </div>

      {/* ── CTA — header ────────────────────────────────── */}
      <div
        style={{
          marginTop: "clamp(3rem, 6vh, 5rem)",
          borderTop: "1px solid var(--border)",
          borderBottom: "1px solid var(--border)",
          background: "var(--bg-section)",
        }}
      >
        <div className="max-w-[1280px] mx-auto px-6 sm:px-8 py-8 sm:py-10">
          <SectionHeader
            title={t("sectionCta.title")}
            subtitle={t("sectionCta.subtitle")}
          />
        </div>
      </div>

      {/* ── Chat ────────────────────────────────────────── */}
      <div className="max-w-[1280px] mx-auto">
        <ChatAgent />
      </div>

      {/* ── Footer ──────────────────────────────────────── */}
      <div className="max-w-[1280px] mx-auto">
        <Footer />
      </div>

    </div>
  );
}
