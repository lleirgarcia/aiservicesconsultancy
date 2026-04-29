"use client";

import { TEMPLATE_COLOR_OPTIONS, getColorLabel } from "@/services/designTokens";

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  label?: string;
}

export function ColorPicker({ value, onChange, label = "Color" }: ColorPickerProps) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-[var(--fg)]">{label}</label>

      {/* Color swatches */}
      <div className="grid grid-cols-3 gap-2">
        {TEMPLATE_COLOR_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`w-full h-12 rounded-lg border-2 transition-all ${
              value === option.value
                ? "border-[var(--accent)] ring-2 ring-[var(--accent)]"
                : "border-[var(--border)] hover:border-[var(--muted-hi)]"
            }`}
            style={{ backgroundColor: option.value }}
            title={option.name}
          />
        ))}
      </div>

      {/* Current color label */}
      <p className="text-xs text-[var(--muted)] mt-2">{getColorLabel(value)}</p>

      {/* Custom color input */}
      <div className="mt-2">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#000000"
          className="w-full px-3 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--fg)] text-xs placeholder-[var(--muted)]"
        />
      </div>
    </div>
  );
}
