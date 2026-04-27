"use client";

import { useI18n } from "@/i18n/LocaleContext";
import SectionHeader from "@/components/ui/SectionHeader";

const HEADLINE_FONT = "var(--font-space-grotesk), 'Space Grotesk', system-ui, sans-serif";

const STEPS = [1, 2, 3, 4, 5, 6, 7, 8] as const;

export default function ComoTrabajamos() {
  const { t } = useI18n();

  return (
    <>
      {/* Header */}
      <div
        style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-section)" }}
      >
        <div className="max-w-[1280px] mx-auto px-6 sm:px-8 py-8 sm:py-10">
          <SectionHeader
            title={t("comoTrabajamos.heading")}
            subtitle={t("comoTrabajamos.subtitle")}
          />
        </div>
      </div>

      {/* Steps grid */}
      <div style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="max-w-[1280px] mx-auto px-5 sm:px-8 pt-12 sm:pt-16 pb-8 sm:pb-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-0">
            {STEPS.map((n, i) => {
              const isLastRow = i >= 6;
              const isRightCol = i % 2 === 1;
              const isLastItem = i === STEPS.length - 1;
              const hasBottomSm = !isLastRow;
              const hasRightSm =
                !isRightCol && !(isLastItem && STEPS.length % 2 === 0);
              return (
                <div
                  key={n}
                  className={[
                    "border-0",
                    hasBottomSm && "sm:border-b sm:[border-bottom-color:var(--border)]",
                    hasRightSm && "sm:border-r sm:[border-right-color:var(--border)]",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  style={{
                    padding: "clamp(1.25rem, 3vw, 1.75rem) clamp(1rem, 2.5vw, 1.5rem)",
                    position: "relative",
                  }}
                >
                  {/* Step number */}
                  <span
                    style={{
                      display: "block",
                      fontFamily: "var(--font-geist-mono), monospace",
                      fontSize: "clamp(2rem, 4vw, 3rem)",
                      fontWeight: 700,
                      lineHeight: 1,
                      color: "var(--accent)",
                      opacity: 0.18,
                      marginBottom: "0.75rem",
                      letterSpacing: "-0.04em",
                      userSelect: "none",
                    }}
                  >
                    {String(n).padStart(2, "0")}
                  </span>

                  {/* Title */}
                  <h3
                    style={{
                      fontFamily: HEADLINE_FONT,
                      fontSize: "clamp(0.95rem, 1.5vw, 1.1rem)",
                      fontWeight: 700,
                      letterSpacing: "-0.01em",
                      color: "var(--fg)",
                      marginBottom: "0.5rem",
                    }}
                  >
                    {t(`comoTrabajamos.s${n}title`)}
                  </h3>

                  {/* Body */}
                  <p
                    style={{
                      fontSize: "0.875rem",
                      lineHeight: 1.65,
                      color: "var(--muted)",
                      margin: 0,
                    }}
                  >
                    {t(`comoTrabajamos.s${n}body`)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
