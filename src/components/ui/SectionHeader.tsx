import type { ReactNode } from "react";

const HEADLINE_FONT = "var(--font-space-grotesk), 'Space Grotesk', system-ui, sans-serif";

export type SectionHeaderProps = {
  title: ReactNode;
  /** Renders below the title: accent, uppercase, tracking (same as “Cómo trabajamos”) */
  subtitle?: ReactNode;
};

/**
 * Shared block: left accent bar + main title (Space Grotesk) + optional subtitle (accent, caps).
 * Spacing to the real content is applied as padding-top on the following block (not here).
 */
export default function SectionHeader({ title, subtitle }: SectionHeaderProps) {
  return (
    <div>
      <h2
        style={{
          fontFamily: HEADLINE_FONT,
          fontSize: "clamp(1.8rem, 4vw, 3rem)",
          fontWeight: 700,
          letterSpacing: "-0.02em",
          lineHeight: 1.1,
          color: "var(--fg)",
          margin: 0,
          paddingLeft: "0.85rem",
          borderLeft: "2px solid var(--accent)",
        }}
      >
        {title}
      </h2>
      {subtitle != null && (
        <p
          className="text-xs font-medium uppercase tracking-widest mt-3"
          style={{ color: "var(--accent)", paddingLeft: "0.85rem" }}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}
