import type { CSSProperties } from "react";

type LogoProps = {
  /** Font size in pixels (default 20) */
  size?: number;
  className?: string;
};

const GREEN_LIGHT = "#9EFFCC";
const GREEN_MID = "#00FF88";
const GREEN_DARK = "#007A44";

export default function Logo({ size = 20, className }: LogoProps) {
  const base: CSSProperties = {
    fontFamily: "var(--font-orbitron), ui-sans-serif, system-ui, sans-serif",
    fontWeight: 700,
    fontSize: `${size}px`,
    letterSpacing: "0.02em",
    lineHeight: 1,
    textTransform: "uppercase",
    display: "inline-block",
  };

  return (
    <span
      className={className}
      style={{ display: "inline-flex", alignItems: "baseline", gap: "0.18em" }}
      aria-label="fixtheops.com"
    >
      <span style={{ ...base, color: GREEN_LIGHT }}>fix</span>
      <span style={{ ...base, color: GREEN_MID }}>the</span>
      <span style={{ ...base, color: GREEN_DARK }}>ops.com</span>
    </span>
  );
}
