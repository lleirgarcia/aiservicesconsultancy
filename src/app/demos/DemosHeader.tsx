"use client";

import ContactTrigger from "@/components/ui/ContactTrigger";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";
import { useI18n } from "@/i18n/LocaleContext";
import BrandLogo from "../_landing/BrandLogo";
import SectionNav from "../_landing/SectionNav";

/* Misma cabecera que la landing: el menú redirige a sus secciones. */
export default function DemosHeader() {
  const { t } = useI18n();
  return (
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
  );
}
