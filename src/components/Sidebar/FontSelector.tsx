"use client";

import { TEMPLATE_FONTS } from "@/services/designTokens";

interface FontSelectorProps {
  value: string;
  onChange: (font: string) => void;
  label?: string;
}

export function FontSelector({ value, onChange, label = "Font" }: FontSelectorProps) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-[var(--fg)]">{label}</label>

      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--fg)] text-sm focus:outline-none focus:border-[var(--accent)]"
      >
        {TEMPLATE_FONTS.map((font) => (
          <option key={font} value={font}>
            {font}
          </option>
        ))}
      </select>

      {/* Font preview */}
      <div
        className="w-full h-12 rounded-lg bg-[var(--bg-section)] border border-[var(--border)] flex items-center justify-center text-[var(--fg)]"
        style={{ fontFamily: value }}
      >
        Preview
      </div>
    </div>
  );
}
