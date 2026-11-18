"use client";

import Footer from "@/components/sections/Footer";
import ContactTrigger from "@/components/ui/ContactTrigger";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";
import { useI18n } from "@/i18n/LocaleContext";
import AboutUs from "./_landing/AboutUs";
import CallCta from "./_landing/CallCta";
import CaseStudies from "./_landing/CaseStudies";
import DemoDashboard from "./_landing/DemoDashboard";
import Humano from "./_landing/Humano";
import Rising from "./_landing/Rising";
import ScrollProgressBar from "./_landing/ScrollProgressBar";
import UniverseBackground from "./_landing/UniverseBackground";
import BrandLogo from "./_landing/BrandLogo";
import SectionNav from "./_landing/SectionNav";

/* Sistema tipográfico estilo lateralbuilder: Anton para titulares,
   Space Grotesk para texto, JetBrains Mono para datos. */
const ANTON = "var(--font-anton), 'Anton', 'Arial Narrow', sans-serif";
const GROTESK = "var(--font-space-grotesk), 'Space Grotesk', system-ui, sans-serif";

const WHATSAPP_URL = "https://wa.me/34626572151";
const PHONE_TEL = "+34626572151";
/* Cambiar por la URL del vídeo concreto cuando exista. */
const VIDEO_URL = "https://www.youtube.com/@kroomixcom";

export default function HomeV2() {
  const { t } = useI18n();
  const waHref = `${WHATSAPP_URL}?text=${encodeURIComponent(t("v3.ctaFinal.waText"))}`;

  return (
    <div className="v3-theme min-h-screen" style={{ fontFamily: GROTESK }}>
      <ScrollProgressBar />

      {/* Fondo: campo de estrellas que va de blanco a noche con el scroll */}
      <UniverseBackground />

      {/* ── Header ─────────────────────────────────────── */}
      <header
        className="sticky top-0 z-50 w-full"
        style={{
          background: "var(--surface-glass)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div className="max-w-[1120px] mx-auto px-6 h-16 flex items-center justify-between gap-4">
          <a href="/" aria-label={t("header.homeAria")} className="inline-flex shrink-0 items-center">
            <BrandLogo height={44} ratio={3.42} />
          </a>
          <div className="flex items-center gap-3 sm:gap-4">
            <SectionNav />
            <ContactTrigger />
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      {/* ── Hero: ocupa la primera pantalla y entra solo al cargar ── */}
      <section
        className="v3-hero-vh px-6 flex flex-col items-center justify-center text-center overflow-x-clip"
        style={{ paddingTop: "clamp(1.5rem, 4vh, 3rem)", paddingBottom: "clamp(1.5rem, 4vh, 3rem)" }}
      >
        {/* Enlace al vídeo, con el borde girando (recurso de attio) */}
        <a
          className="v3-pill v3-enter"
          href={VIDEO_URL}
          target="_blank"
          rel="noopener noreferrer"
          style={{ marginBottom: "clamp(1rem, 2.5vh, 1.75rem)", "--delay": "0ms" } as React.CSSProperties}
        >
          <span className="v3-pill-body">
            {t("v3.hero.pill")}
            <svg
              className="v3-pill-chevron"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M9 6l6 6-6 6" />
            </svg>
          </span>
        </a>

        {/* Una frase y una subfrase. El remate en azul, que es lo que compra el cliente. */}
        <h1
          className="v3-enter"
          style={
            {
              fontFamily: ANTON,
              fontWeight: 400,
              letterSpacing: "-0.005em",
              lineHeight: 1.04,
              fontSize: "clamp(1.75rem, min(4.4vw, 7.4vh), 4rem)",
              margin: 0,
              marginBottom: "0.75rem",
              "--delay": "90ms",
            } as React.CSSProperties
          }
        >
          <span className="v3-h1-line" style={{ display: "block", color: "var(--fg)" }}>
            {t("v3.hero.t1")}
          </span>
          <span className="v3-h1-line" style={{ display: "block", color: "var(--accent)" }}>
            {t("v3.hero.t2")}
          </span>
        </h1>

        {/* La garantía y el contacto, a la vista sin hacer scroll: es lo que
            decide a un empresario con prisa. */}
        <p
          className="v3-enter"
          style={
            {
              fontFamily: GROTESK,
              fontSize: "clamp(1rem, 1.5vw, 1.3rem)",
              fontWeight: 500,
              lineHeight: 1.5,
              color: "var(--fg)",
              margin: 0,
              marginBottom: "clamp(1.5rem, 3.5vh, 2.25rem)",
              "--delay": "260ms",
            } as React.CSSProperties
          }
        >
          {t("v3.hero.promise")}
        </p>

        <div
          className="v3-enter flex flex-wrap items-center justify-center gap-3"
          style={{ marginBottom: "1rem", "--delay": "320ms" } as React.CSSProperties}
        >
          <a
            href={`tel:${PHONE_TEL}`}
            className="inline-flex items-center gap-2.5 transition-opacity hover:opacity-85"
            style={{
              background: "var(--accent)",
              color: "var(--accent-on)",
              borderRadius: 999,
              padding: "0.85rem 1.5rem",
              fontFamily: GROTESK,
              fontWeight: 700,
              fontSize: "1rem",
              textDecoration: "none",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.906.339 1.849.573 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
            {t("v3.hero.ctaCall")}
          </a>
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 transition-colors"
            style={{
              background: "var(--surface)",
              color: "var(--fg)",
              border: "1.5px solid var(--border)",
              borderRadius: 999,
              padding: "0.8rem 1.4rem",
              fontFamily: GROTESK,
              fontWeight: 700,
              fontSize: "1rem",
              textDecoration: "none",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#25D366" aria-hidden>
              <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm5.3 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .1-3.2-.7-2.7-1.1-4.4-3.8-4.5-4-.1-.2-1.1-1.5-1.1-2.8 0-1.3.7-2 1-2.3.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.4 0 .5l-.3.5-.4.4c-.1.1-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.3 2.4 1.5.3.1.5.1.6-.1l.9-1c.2-.3.4-.2.6-.1l1.9.9c.3.1.5.2.5.3.1.2.1.7-.1 1.2z" />
            </svg>
            {t("v3.hero.ctaWa")}
          </a>
        </div>

        {/* Lo que un empresario con prisa pregunta antes de llamar. */}
        <ul
          className="v3-enter flex flex-wrap items-center justify-center"
          style={
            {
              listStyle: "none",
              padding: 0,
              margin: 0,
              marginBottom: "clamp(3rem, 9vh, 6rem)",
              columnGap: "1.25rem",
              rowGap: "0.35rem",
              fontFamily: GROTESK,
              fontSize: "0.9rem",
              fontWeight: 500,
              color: "var(--muted)",
              "--delay": "380ms",
            } as React.CSSProperties
          }
        >
          {(["fact1", "fact2"] as const).map((k) => (
            <li key={k} className="inline-flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M20 6L9 17l-5-5" />
              </svg>
              {t(`v3.hero.${k}`)}
            </li>
          ))}
        </ul>

        <div className="w-full max-w-[1180px]">
          <Humano />
        </div>

      </section>

      {/* ── Prueba primero: casos reales y llamada, antes del recorrido largo ── */}
      <CaseStudies />
      <CallCta ns="callCtaEarly" />

      {/* ── Ver lo que hacemos (tablero + ejemplo detallado) ── */}
      <section
        id="como-trabajamos"
        className="px-6 overflow-clip"
        style={{
          borderTop: "1px solid var(--border)",
          paddingTop: "clamp(2rem, 5vh, 3.5rem)",
          paddingBottom: "clamp(3.5rem, 9vh, 6rem)",
        }}
      >
        <div className="max-w-[1280px] mx-auto">
          <Rising
            head={
                <h2
                  style={{
                    fontFamily: ANTON,
                    fontSize: "clamp(1.7rem, 3.6vw, 2.9rem)",
                    fontWeight: 400,
                      letterSpacing: "-0.005em",
                    lineHeight: 1.1,
                    color: "var(--fg)",
                    margin: 0,
                    marginBottom: "clamp(1.5rem, 3.5vh, 2.25rem)",
                    textAlign: "center",
                  }}
                >
                  {t("v3.board.heading")}
                </h2>
            }
            body={<DemoDashboard />}
          />
        </div>
      </section>

      <AboutUs />
      <CallCta />

      {/* ── Footer ─────────────────────────────────────── */}
      <div style={{ borderTop: "1px solid var(--border)" }}>
        <Footer
          logoNode={<BrandLogo height={88} ratio={3.42} />}
          madeBy={
            <>
              {t("v3.madeBy")}{" "}
              <a
                href="https://lateralbuilder.com"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  /* dorado de la paleta de lateralbuilder */
                  color: "#C89B25",
                  fontWeight: 600,
                  textDecorationLine: "underline",
                  textUnderlineOffset: 3,
                }}
              >
                lateralbuilder.com
              </a>
            </>
          }
        />
      </div>
    </div>
  );
}
