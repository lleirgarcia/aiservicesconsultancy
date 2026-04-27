import type { CSSProperties } from "react";

type LogoProps = {
  /**
   * Font size in pixels. If provided, overrides the responsive default.
   * When omitted, the logo scales from 14px on mobile to 20px on ≥640px.
   */
  size?: number;
  className?: string;
};

const CYAN_BRIGHT = "#c9e6ff";
const CYAN_MID   = "#89ceff";
const CYAN_DIM   = "#3a7fa8";

export default function Logo({ size, className }: LogoProps) {
  const base: CSSProperties = {
    fontFamily: "var(--font-space-grotesk), 'Space Grotesk', ui-sans-serif, system-ui, sans-serif",
    fontWeight: 700,
    fontSize: size != null ? `${size}px` : undefined,
    letterSpacing: "0.02em",
    lineHeight: 1,
    textTransform: "uppercase",
    display: "inline-block",
  };

  const sizeClass =
    size == null ? "text-[13px] sm:text-[20px]" : "";

  return (
    <span
      className={`${sizeClass} ${className ?? ""}`.trim()}
      style={{ display: "inline-flex", alignItems: "baseline", gap: "0.18em" }}
      aria-label="kroomix.com"
    >
      <span style={{ ...base, color: CYAN_BRIGHT }}>kroo</span>
      <span style={{ ...base, color: CYAN_MID }}>mix</span>
      <span style={{ ...base, color: CYAN_DIM }}>.com</span>
    </span>
  );
}
