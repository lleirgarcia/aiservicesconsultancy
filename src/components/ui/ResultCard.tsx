interface ResultCardProps {
  label: string;
  value: string;
  sublabel?: string;
  highlight?: boolean;
}

export default function ResultCard({ label, value, sublabel, highlight = false }: ResultCardProps) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--muted)" }}>
        {label}
      </p>
      <p className={highlight ? "big-number-highlight" : "big-number"}>
        {value}
      </p>
      {sublabel && (
        <p className="text-xs" style={{ color: "var(--muted)" }}>
          {sublabel}
        </p>
      )}
    </div>
  );
}
