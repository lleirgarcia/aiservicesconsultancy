"use client";

import { useI18n } from "@/i18n/LocaleContext";
import SectionHeader from "@/components/ui/SectionHeader";

const HEADLINE_FONT = "var(--font-space-grotesk), 'Space Grotesk', system-ui, sans-serif";

const TAGS = ["i1", "i2", "i3", "i4"] as const;

export default function QuienesSomos() {
  const { t } = useI18n();

  return (
    <>
      {/* Header */}
      <div style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-section)" }}>
        <div className="max-w-[1280px] mx-auto px-6 sm:px-8 py-8 sm:py-10">
          <SectionHeader
            title={t("quienes.title")}
            subtitle={t("quienes.subtitle")}
          />
        </div>
      </div>

      {/* Body */}
      <div style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="max-w-[1280px] mx-auto px-5 sm:px-8 pt-12 sm:pt-16 pb-8 sm:pb-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start max-w-[1100px]">

            {/* Left: description */}
            <div>
              <p
                style={{
                  fontFamily: HEADLINE_FONT,
                  fontSize: "clamp(1.15rem, 2.2vw, 1.5rem)",
                  fontWeight: 600,
                  letterSpacing: "-0.015em",
                  lineHeight: 1.45,
                  color: "var(--fg)",
                  marginBottom: "1.25rem",
                }}
              >
                {t("quienes.lead")}
              </p>
              <p
                style={{
                  fontSize: "0.9rem",
                  lineHeight: 1.7,
                  color: "var(--muted)",
                  marginBottom: "1rem",
                }}
              >
                {t("quienes.body1")}
              </p>
              <p
                style={{
                  fontSize: "0.9rem",
                  lineHeight: 1.7,
                  color: "var(--muted)",
                }}
              >
                {t("quienes.body2")}
              </p>
            </div>

            {/* Right: tags */}
            <div className="flex flex-col gap-3">
              {TAGS.map((tag) => (
                <div
                  key={tag}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    padding: "0.875rem 1rem",
                    border: "1px solid var(--border)",
                    borderRadius: 6,
                    background: "var(--bg-section)",
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: "var(--accent)",
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      fontSize: "0.875rem",
                      fontWeight: 500,
                      color: "var(--muted-hi)",
                    }}
                  >
                    {t(`quienes.${tag}`)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
