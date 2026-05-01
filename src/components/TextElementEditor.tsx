"use client";

import { TextElementContent } from "@/types/instagram-builder";
import { ColorPicker } from "@/components/Sidebar/ColorPicker";
import { FontSelector } from "@/components/Sidebar/FontSelector";
import { FONT_SIZES } from "@/services/designTokens";

interface TextElementEditorProps {
  content: TextElementContent;
  onChange: (content: Partial<TextElementContent>) => void;
  onDone: () => void;
}

export function TextElementEditor({ content, onChange, onDone }: TextElementEditorProps) {
  return (
    <div className="flex flex-col gap-4 p-4 bg-[var(--bg-section)] rounded-lg border border-[var(--border)]">
      {/* Text input */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-[var(--fg)]">Text Content</label>
        <textarea
          value={content.text}
          onChange={(e) => onChange({ text: e.target.value })}
          placeholder="Enter text..."
          className="w-full px-3 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--fg)] text-sm placeholder-[var(--muted)] focus:outline-none focus:border-[var(--accent)]"
          rows={3}
          maxLength={500}
        />
        <p className="text-xs text-[var(--muted)]">{content.text.length}/500</p>
      </div>

      {/* Font selection */}
      <FontSelector value={content.font_family} onChange={(font) => onChange({ font_family: font })} />

      {/* Font size */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-[var(--fg)]">Font Size</label>
        <select
          value={content.font_size}
          onChange={(e) => onChange({ font_size: parseInt(e.target.value) })}
          className="w-full px-3 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--fg)] text-sm focus:outline-none focus:border-[var(--accent)]"
        >
          {Object.entries(FONT_SIZES).map(([label, size]) => (
            <option key={size} value={size}>
              {label} ({size}px)
            </option>
          ))}
        </select>
      </div>

      {/* Font weight */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-[var(--fg)]">Font Weight</label>
        <select
          value={content.font_weight}
          onChange={(e) => onChange({ font_weight: parseInt(e.target.value) })}
          className="w-full px-3 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--fg)] text-sm focus:outline-none focus:border-[var(--accent)]"
        >
          <option value={300}>Light (300)</option>
          <option value={400}>Regular (400)</option>
          <option value={500}>Medium (500)</option>
          <option value={600}>Semibold (600)</option>
          <option value={700}>Bold (700)</option>
        </select>
      </div>

      {/* Color picker */}
      <ColorPicker value={content.color} onChange={(color) => onChange({ color })} label="Text Color" />

      {/* Text alignment */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-[var(--fg)]">Alignment</label>
        <div className="flex gap-2">
          {(["left", "center", "right"] as const).map((align) => (
            <button
              key={align}
              onClick={() => onChange({ text_align: align })}
              className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                content.text_align === align
                  ? "bg-[var(--accent)] text-[var(--accent-on)]"
                  : "bg-[var(--bg-elevated)] text-[var(--fg)] border border-[var(--border)]"
              }`}
            >
              {align.charAt(0).toUpperCase() + align.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Done button */}
      <button
        onClick={onDone}
        className="w-full px-4 py-2 rounded-lg bg-[var(--accent)] text-[var(--accent-on)] font-medium hover:opacity-90 transition-opacity"
      >
        Done
      </button>
    </div>
  );
}
