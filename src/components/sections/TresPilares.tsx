"use client";

import type React from "react";
import { useI18n } from "@/i18n/LocaleContext";

const HEADLINE_FONT = "var(--font-space-grotesk), 'Space Grotesk', system-ui, sans-serif";

const PILARES = [
  {
    key: "problemas",
    accent: "#ff7070",
    accentDim: "rgba(255,112,112,0.08)",
    /** Subtle red wash + dark base (reads as tinted glass) */
    cardBackground:
      "radial-gradient(120% 75% at 0% 0%, rgba(255,112,112,0.18) 0%, rgba(255,64,64,0.04) 42%, transparent 72%), linear-gradient(180deg, rgba(50,24,24,0.6) 0%, rgba(29,32,34,0.92) 100%)",
    delay: "0s",
    duration: "5.2s",
    itemKeys: ["i1", "i2", "i3", "i4"],
  },
  {
    key: "mejoras",
    accent: "var(--accent)",
    accentDim: "var(--accent-dim)",
    cardBackground:
      "radial-gradient(120% 75% at 0% 0%, rgba(137,206,255,0.16) 0%, rgba(137,206,255,0.04) 42%, transparent 72%), linear-gradient(180deg, rgba(20,32,40,0.65) 0%, rgba(29,32,34,0.92) 100%)",
    delay: "0.4s",
    duration: "6s",
    itemKeys: ["i1", "i2", "i3", "i4"],
  },
  {
    key: "dinero",
    accent: "#6be591",
    accentDim: "rgba(107,229,145,0.08)",
    cardBackground:
      "radial-gradient(120% 75% at 0% 0%, rgba(107,229,145,0.15) 0%, rgba(80,200,120,0.04) 42%, transparent 72%), linear-gradient(180deg, rgba(18,40,32,0.62) 0%, rgba(29,32,34,0.92) 100%)",
    delay: "0.8s",
    duration: "5.6s",
    itemKeys: ["i1", "i2", "i3", "i4"],
  },
] as const;

export default function TresPilares() {
  const { t } = useI18n();

  return (
    <div
      style={{
        background: "var(--bg)",
        paddingTop: "clamp(2.75rem, 6.5vh, 4.25rem)",
        paddingBottom: "clamp(2rem, 5vh, 3.25rem)",
        paddingLeft: 0,
        paddingRight: 0,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Ambient glow central */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "70vw",
          height: "60%",
          background:
            "radial-gradient(ellipse at center, rgba(137,206,255,0.04) 0%, transparent 70%)",
          pointerEvents: "none",
          filter: "blur(40px)",
        }}
      />

      <div className="max-w-[1280px] mx-auto px-6 sm:px-8 relative">
        <style>{`
          @keyframes flowArrow {
            0% { stroke-dashoffset: 0; }
            100% { stroke-dashoffset: -12px; }
          }

          .arrow-line {
            animation: flowArrow 2s linear infinite;
            filter: drop-shadow(0 0 8px rgba(137, 206, 255, 0.4));
          }

          .arrow-line.left {
            filter: drop-shadow(0 0 8px rgba(255, 112, 112, 0.3));
          }

          .arrow-line.right {
            filter: drop-shadow(0 0 8px rgba(107, 229, 145, 0.3));
          }

          .title-box {
            position: relative;
            display: inline-block;
            width: 100%;
          }
        `}</style>

        <div className="relative">
          <div className="title-box">
            <p
              className="mb-8 sm:mb-10 md:mb-12 w-full max-w-3xl mx-auto text-center text-balance text-[1.05rem] sm:text-[1.2rem] md:text-[1.35rem] leading-snug relative z-10"
              style={{ color: "var(--fg)" }}
            >
              {t("sectionSolution.verticalsLead")}
            </p>
          </div>

          {/* Futuristic Arrows SVG - responsive for all sizes */}
          <svg
            className="absolute w-full pointer-events-none hidden md:block"
            style={{
              top: 0,
              left: 0,
              overflow: "visible",
              height: "clamp(180px, 40vw, 280px)",
            }}
            viewBox="0 0 1000 280"
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              <marker
                id="arrowHeadLeft"
                markerWidth="12"
                markerHeight="12"
                refX="10"
                refY="6"
                orient="auto"
                markerUnits="strokeWidth"
              >
                <path d="M0,0 L0,12 L12,6 z" fill="#ff7070" />
              </marker>
              <marker
                id="arrowHeadCenter"
                markerWidth="12"
                markerHeight="12"
                refX="10"
                refY="6"
                orient="auto"
                markerUnits="strokeWidth"
              >
                <path d="M0,0 L0,12 L12,6 z" fill="rgba(137, 206, 255, 1)" />
              </marker>
              <marker
                id="arrowHeadRight"
                markerWidth="12"
                markerHeight="12"
                refX="10"
                refY="6"
                orient="auto"
                markerUnits="strokeWidth"
              >
                <path d="M0,0 L0,12 L12,6 z" fill="#6be591" />
              </marker>
            </defs>

            {/* Left arrow - from left edge of box */}
            <line
              className="arrow-line left"
              x1="150"
              y1="70"
              x2="50"
              y2="178"
              stroke="#ff7070"
              strokeWidth="2.5"
              markerEnd="url(#arrowHeadLeft)"
              strokeDasharray="12,8"
            />

            {/* Center arrow - from center bottom of box */}
            <line
              className="arrow-line"
              x1="500"
              y1="80"
              x2="500"
              y2="198"
              stroke="rgba(137, 206, 255, 0.9)"
              strokeWidth="2.5"
              markerEnd="url(#arrowHeadCenter)"
              strokeDasharray="12,8"
            />

            {/* Right arrow - from right edge of box */}
            <line
              className="arrow-line right"
              x1="850"
              y1="70"
              x2="950"
              y2="178"
              stroke="#6be591"
              strokeWidth="2.5"
              markerEnd="url(#arrowHeadRight)"
              strokeDasharray="12,8"
            />
          </svg>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 mt-5 md:mt-[147px]">
          {PILARES.map((pilar) => (
            <div
              key={pilar.key}
              className="pilar-float"
              style={
                {
                  "--float-delay": pilar.delay,
                  "--float-duration": pilar.duration,
                } as React.CSSProperties
              }
            >
              {/* Card */}
              <div
                style={{
                  background: pilar.cardBackground,
                  backdropFilter: "blur(20px)",
                  WebkitBackdropFilter: "blur(20px)",
                  border: "1px solid var(--glass-border)",
                  borderRadius: 12,
                  padding: "clamp(1.25rem, 2.5vw, 1.65rem)",
                  boxShadow:
                    "0 24px 64px rgba(0,0,0,0.45), 0 8px 24px rgba(0,0,0,0.25), 0 1px 0 rgba(255,255,255,0.04) inset",
                  position: "relative",
                  overflow: "hidden",
                  height: "100%",
                }}
              >
                {/* Top accent bar */}
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 2,
                    background: `linear-gradient(90deg, ${pilar.accent} 0%, transparent 80%)`,
                  }}
                />

                {/* Subtle corner glow */}
                <div
                  style={{
                    position: "absolute",
                    top: -30,
                    left: -20,
                    width: 120,
                    height: 120,
                    background: `radial-gradient(circle, ${pilar.accentDim} 0%, transparent 70%)`,
                    pointerEvents: "none",
                  }}
                />

                {/* Label */}
                <p
                  style={{
                    fontFamily: "var(--font-geist-mono), monospace",
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.2em",
                    textTransform: "uppercase" as const,
                    color: pilar.accent,
                    marginBottom: "1rem",
                    position: "relative",
                  }}
                >
                  {t(`pilares.${pilar.key}.label`)}
                </p>

                <h3
                  style={{
                    fontFamily: HEADLINE_FONT,
                    fontSize:
                      "clamp(calc(1.2rem - 2px), calc(2vw - 2px), calc(1.55rem - 2px))",
                    fontWeight: 700,
                    letterSpacing: "-0.02em",
                    lineHeight: 1.15,
                    color: "var(--fg)",
                    marginBottom: "0.875rem",
                    position: "relative",
                  }}
                >
                  {t(`pilares.${pilar.key}.heading`)}
                </h3>

                <p
                  style={{
                    fontSize: "0.875rem",
                    lineHeight: 1.65,
                    color: "var(--muted)",
                    marginBottom: "1.5rem",
                    position: "relative",
                  }}
                >
                  {t(`pilares.${pilar.key}.body`)}
                </p>

                <ul
                  style={{
                    listStyle: "none",
                    padding: 0,
                    margin: 0,
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.45rem",
                    position: "relative",
                  }}
                >
                  {pilar.itemKeys.map((ik) => (
                    <li
                      key={ik}
                      style={{ display: "flex", alignItems: "baseline", gap: "0.5rem" }}
                    >
                      <span
                        style={{
                          color: pilar.accent,
                          fontSize: 9,
                          fontWeight: 700,
                          flexShrink: 0,
                          letterSpacing: "0.05em",
                        }}
                      >
                        →
                      </span>
                      <span
                        style={{
                          fontSize: "0.8rem",
                          lineHeight: 1.4,
                          color: "var(--muted-hi)",
                        }}
                      >
                        {t(`pilares.${pilar.key}.${ik}`)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
