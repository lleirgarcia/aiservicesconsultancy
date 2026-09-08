"use client";

import { useEffect, useState } from "react";
import Footer from "@/components/sections/Footer";
import ContactTrigger from "@/components/ui/ContactTrigger";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";
import { useI18n } from "@/i18n/LocaleContext";
import DemoDashboard from "./DemoDashboard";
import Humano from "./Humano";
import Rising from "./Rising";
import UniverseBackground from "./UniverseBackground";
import BrandLogo from "./BrandLogo";

/* Sistema tipográfico estilo lateralbuilder: Anton para titulares,
   Space Grotesk para texto, JetBrains Mono para datos. */
const ANTON = "var(--font-anton), 'Anton', 'Arial Narrow', sans-serif";
const GROTESK = "var(--font-space-grotesk), 'Space Grotesk', system-ui, sans-serif";
const JMONO = "var(--font-jetbrains), 'JetBrains Mono', ui-monospace, monospace";

const WHATSAPP_URL = "https://wa.me/34626572151";
/* Cambiar por la URL del vídeo concreto cuando exista. */
const VIDEO_URL = "https://www.youtube.com/@kroomixcom";

/** Reloj vivo del ticker. */
function Clock() {
  const { docLang } = useI18n();
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return <span suppressHydrationWarning>{now ? now.toLocaleTimeString(docLang) : "--:--:--"}</span>;
}

/** Progreso del año en curso, con barrita. */
function YearProgress() {
  const [pct, setPct] = useState<number | null>(null);
  const [year, setYear] = useState<number>(2026);
  useEffect(() => {
    const now = new Date();
    const y = now.getFullYear();
    const start = new Date(y, 0, 1).getTime();
    const end = new Date(y + 1, 0, 1).getTime();
    setYear(y);
    setPct(((now.getTime() - start) / (end - start)) * 100);
  }, []);
  return (
    <span className="inline-flex items-center gap-2">
      {year}
      <span
        aria-hidden
        style={{
          display: "inline-block",
          width: 56,
          height: 8,
          borderRadius: 4,
          border: "1px solid var(--border)",
          background: "var(--bg)",
          overflow: "hidden",
        }}
      >
        <span
          style={{
            display: "block",
            height: "100%",
            width: `${pct ?? 0}%`,
            background: "var(--accent)",
          }}
        />
      </span>
      <span suppressHydrationWarning>{pct === null ? "…" : `${pct.toFixed(1).replace(".", ",")}%`}</span>
    </span>
  );
}

const TICKER_H = 34;


/** Marquesina de datos (estilo lateralbuilder). La inferior queda fija, siempre visible. */
function TickerBar({ position }: { position: "top" | "bottom" }) {
  const { t } = useI18n();
  const fixed = position === "bottom";
  return (
    <div
      className={`w-full overflow-x-auto v3-noscrollbar ${fixed ? "fixed bottom-0 left-0 right-0 z-40" : ""}`}
      style={{
        background: "var(--bg-soft)",
        ...(fixed
          ? { borderTop: "1px solid var(--border)" }
          : { borderBottom: "1px solid var(--border)" }),
      }}
    >
      <div
        className="flex items-center gap-3 whitespace-nowrap px-4 sm:px-6"
        style={{
          fontFamily: JMONO,
          fontSize: "0.74rem",
          color: "var(--muted-hi)",
          height: TICKER_H,
        }}
      >
        <Clock />
        <span style={{ color: "var(--border)" }}>·</span>
        <YearProgress />
        <span style={{ color: "var(--border)" }}>·</span>
        <span style={{ fontWeight: 700 }}>{t("v3.ticker.calc")}</span>
        <span style={{ color: "var(--border)" }}>·</span>
        <span>{t("v3.ticker.loc")}</span>
        <span style={{ color: "var(--border)" }}>·</span>
        <span>{t("v3.ticker.reply")}</span>
        <span style={{ color: "var(--border)" }}>·</span>
        <span style={{ color: "var(--accent)" }}>{t("v3.ticker.hype")}</span>
      </div>
    </div>
  );
}

export default function HomeV2() {
  const { t } = useI18n();
  const waHref = `${WHATSAPP_URL}?text=${encodeURIComponent(t("v3.ctaFinal.waText"))}`;

  return (
    <div className="v3-theme min-h-screen" style={{ fontFamily: GROTESK, paddingBottom: TICKER_H }}>

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

        <p
          className="v3-enter"
          style={
            {
              fontFamily: GROTESK,
              fontSize: "clamp(1rem, 1.5vw, 1.3rem)",
              fontWeight: 500,
              lineHeight: 1.5,
              color: "var(--muted)",
              margin: 0,
              marginBottom: "clamp(2.75rem, 7vh, 5rem)",
              "--delay": "200ms",
            } as React.CSSProperties
          }
        >
          {t("v3.hero.sub")}
        </p>

        <div className="w-full max-w-[1180px]">
          <Humano />
        </div>

      </section>

      {/* ── Ver lo que hacemos (tablero + ejemplo detallado) ── */}
      <section
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

      {/* ── Marquesina inferior, siempre visible ────────── */}
      <TickerBar position="bottom" />

    </div>
  );
}
