"use client";

import { useI18n } from "@/i18n/LocaleContext";

const em =
  "font-semibold text-inherit px-0.5 rounded-sm [box-decoration-break:clone] [-webkit-box-decoration-break:clone] [background-image:linear-gradient(180deg,transparent_58%,rgba(52,211,153,0.42)_58%)] dark:[background-image:linear-gradient(180deg,transparent_58%,rgba(52,211,153,0.28)_58%)]";

export default function QuienesSomos() {
  const { t } = useI18n();

  return (
    <>
      <div
        className="px-5 sm:px-8 py-10 sm:py-14 section-accent-left"
        style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-section)" }}
      >
        <h2 className="text-2xl md:text-4xl font-bold leading-tight tracking-tight uppercase">
          {t("quienes.title")}
        </h2>
        <p
          className="text-xs font-medium uppercase tracking-widest mt-3"
          style={{ color: "var(--muted)" }}
        >
          {t("quienes.subtitle")}
        </p>
      </div>

      <div style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="min-w-0 max-w-full px-5 sm:px-8 py-12 sm:py-16">
          <div
            className="mx-auto max-w-2xl text-center text-base sm:text-lg leading-relaxed"
            style={{ color: "var(--fg)" }}
          >
            <p className="mb-6">
              {t("quienes.p1a")}
              <span className={em}>{t("quienes.p1em")}</span>
              {t("quienes.p1b")}
            </p>
            <p className="mb-6" style={{ color: "var(--muted)" }}>
              {t("quienes.p2")}
              <span className={em}>{t("quienes.p2em")}</span>.
            </p>
            <p style={{ color: "var(--muted)" }}>
              {t("quienes.p3a")}
              <span className={em}>{t("quienes.p3b")}</span>
              {t("quienes.p3dot")}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
