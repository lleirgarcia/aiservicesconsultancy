import { InputHTMLAttributes } from "react";

interface InputFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  suffix?: string;
}

export default function InputField({
  label,
  hint,
  suffix,
  className = "",
  ...props
}: InputFieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium" style={{ color: "var(--muted)" }}>
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input type="number" min="0" className={`flex-1 ${className}`} {...props} />
        {suffix && (
          <span className="text-xs shrink-0 w-10 text-right" style={{ color: "var(--muted)" }}>
            {suffix}
          </span>
        )}
      </div>
      {hint && (
        <p className="text-xs leading-snug" style={{ color: "var(--muted)" }}>
          {hint}
        </p>
      )}
    </div>
  );
}
