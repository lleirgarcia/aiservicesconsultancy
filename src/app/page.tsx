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

export default function Home() {
  const { t } = useI18n();

  return (
    <div
      className="max-w-5xl mx-auto min-w-0 w-full box-border"
      style={{
        borderLeft: "1px solid var(--border)",
        borderRight: "1px solid var(--border)",
        minHeight: "100vh",
      }}
    >
      <header
        className="px-5 sm:px-6 py-4 flex items-center justify-between gap-3"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <a href="/" aria-label={t("header.homeAria")} className="inline-flex shrink-0">
          <Logo />
        </a>
        <div className="flex items-center gap-4">
          <ContactTrigger />
          <LanguageSwitcher />
        </div>
      </header>

      <div
        className="px-5 sm:px-8 py-14 sm:py-20 section-accent-left"
        style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-section)" }}
      >
        <h1 className="text-3xl md:text-5xl font-bold leading-tight tracking-tight uppercase">
          {t("hero.h1")}
          <span
            className="block font-medium mt-3 md:mt-5"
            style={{
              fontSize: "0.5em",
              color: "var(--muted)",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            {t("hero.sub1")}
            <br />
            {t("hero.sub2")}
            <br />
            {t("hero.sub3")}
          </span>
        </h1>
      </div>

      <PainTyper />

      <div
        className="px-5 sm:px-8 py-10 sm:py-14 section-accent-left"
        style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-section)" }}
      >
        <h2 className="text-2xl md:text-4xl font-bold leading-tight tracking-tight uppercase">
          {t("sectionSolution.title")}
        </h2>
        <p
          className="text-xs font-medium uppercase tracking-widest mt-3"
          style={{ color: "var(--muted)" }}
        >
          {t("sectionSolution.subtitle")}
        </p>
      </div>

      <ServiciosCarrusel />

      <QuienesSomos />

      <div
        className="px-5 sm:px-8 py-10 sm:py-14 section-accent-left"
        style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-section)" }}
      >
        <h2 className="text-2xl md:text-4xl font-bold leading-tight tracking-tight uppercase">
          {t("sectionCta.title")}
        </h2>
        <p
          className="text-xs font-medium uppercase tracking-widest mt-3"
          style={{ color: "var(--muted)" }}
        >
          {t("sectionCta.subtitle")}
        </p>
      </div>

      <ChatAgent />

      <Footer />
    </div>
  );
}
