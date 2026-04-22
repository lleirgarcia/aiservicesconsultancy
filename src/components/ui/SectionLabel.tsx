import type { ComponentType, ReactNode } from "react";

export type SectionIconKey =
  | "info"
  | "target"
  | "workflow"
  | "team"
  | "gear"
  | "eye";

type IconProps = { size?: number };

function IconBase({
  size = 15,
  children,
}: {
  size?: number;
  children: ReactNode;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      style={{ flexShrink: 0, display: "block" }}
    >
      {children}
    </svg>
  );
}

function InfoIcon({ size }: IconProps) {
  return (
    <IconBase size={size}>
      <circle cx="12" cy="12" r="9" />
      <line x1="12" y1="11" x2="12" y2="16" />
      <circle cx="12" cy="8" r="0.7" fill="currentColor" stroke="none" />
    </IconBase>
  );
}

function TargetIcon({ size }: IconProps) {
  return (
    <IconBase size={size}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
    </IconBase>
  );
}

function WorkflowIcon({ size }: IconProps) {
  return (
    <IconBase size={size}>
      <circle cx="5" cy="12" r="2.2" />
      <circle cx="12" cy="12" r="2.2" />
      <circle cx="19" cy="12" r="2.2" />
      <line x1="7.5" y1="12" x2="9.8" y2="12" />
      <line x1="14.2" y1="12" x2="16.5" y2="12" />
    </IconBase>
  );
}

function TeamIcon({ size }: IconProps) {
  return (
    <IconBase size={size}>
      <circle cx="8" cy="8.5" r="2.7" />
      <circle cx="16" cy="8.5" r="2.7" />
      <path d="M2.5 20c0-3 2.2-5 5.5-5s5.5 2 5.5 5" />
      <path d="M10.5 20c0-3 2.2-5 5.5-5s5.5 2 5.5 5" />
    </IconBase>
  );
}

function GearIcon({ size }: IconProps) {
  return (
    <IconBase size={size}>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 2.5v2.8" />
      <path d="M12 18.7v2.8" />
      <path d="M2.5 12h2.8" />
      <path d="M18.7 12h2.8" />
      <path d="M5.2 5.2l2 2" />
      <path d="M16.8 16.8l2 2" />
      <path d="M5.2 18.8l2-2" />
      <path d="M16.8 7.2l2-2" />
    </IconBase>
  );
}

function EyeIcon({ size }: IconProps) {
  return (
    <IconBase size={size}>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
      <circle cx="12" cy="12" r="2.8" />
    </IconBase>
  );
}

const ICONS: Record<SectionIconKey, ComponentType<IconProps>> = {
  info: InfoIcon,
  target: TargetIcon,
  workflow: WorkflowIcon,
  team: TeamIcon,
  gear: GearIcon,
  eye: EyeIcon,
};

type SectionLabelProps = {
  icon: SectionIconKey;
  children: ReactNode;
  size?: number;
  className?: string;
};

export default function SectionLabel({
  icon,
  children,
  size = 15,
  className,
}: SectionLabelProps) {
  const Icon = ICONS[icon];
  return (
    <p
      className={`flex items-center gap-2 text-xs font-medium uppercase tracking-widest ${className ?? ""}`}
      style={{ color: "var(--muted)" }}
    >
      <span
        style={{
          color: "var(--accent)",
          display: "inline-flex",
          lineHeight: 0,
        }}
      >
        <Icon size={size} />
      </span>
      <span>{children}</span>
    </p>
  );
}
