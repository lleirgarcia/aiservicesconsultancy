"use client";

import Image from "next/image";
import { useI18n } from "@/i18n/LocaleContext";
import SectionHeader from "@/components/ui/SectionHeader";

const HEADLINE_FONT = "var(--font-space-grotesk), 'Space Grotesk', system-ui, sans-serif";

const BLOCKS = [1, 2, 3] as const;

export default function QueOfrecemos() {
  const { t } = useI18n();

  return (
    <>
      <div
        style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-section)" }}
      >
        <div className="max-w-[1280px] mx-auto px-6 sm:px-8 py-8 sm:py-10">
          <SectionHeader
            title={t("sectionOfrecemos.heading")}
            subtitle={t("sectionOfrecemos.subtitle")}
          />
        </div>
      </div>

      <div style={{ borderBottom: "1px solid var(--border)" }}>
        <Image
          src="/operativa-digital.png"
          alt="Transformamos tu operativa digital para que ganes tiempo y tomes mejores decisiones"
          width={1535}
          height={1024}
          priority={false}
          className="w-full h-auto"
          style={{ display: "block" }}
        />
      </div>
    </>
  );
}
