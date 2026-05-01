"use client";

import { TemplateElement } from "@/types/instagram-builder";
import { FontSelector } from "@/components/Sidebar/FontSelector";
import { ColorPicker } from "@/components/Sidebar/ColorPicker";
import { FONT_SIZES } from "@/services/designTokens";

interface DesignEditorProps {
  element: TemplateElement;
  onChange: (updates: Partial<TemplateElement>) => void;
  onMoveForward?: () => void;
  onMoveBackward?: () => void;
}

export function DesignEditor({
  element,
  onChange,
  onMoveForward,
  onMoveBackward,
}: DesignEditorProps) {
  if (!element.content || element.type !== "text") {
    return <div className="text-[var(--muted)] text-sm">Select a text element to edit design</div>;
  }

  const content = element.content;

  return (
    <div className="flex flex-col gap-4 p-4 bg-[var(--bg-section)] rounded-lg border border-[var(--border)]">
      <h3 className="font-semibold text-[var(--fg)]">Design Editor</h3>

      {/* Font */}
      <FontSelector
        value={content.font_family}
        onChange={(font) => onChange({ content: { ...content, font_family: font } })}
      />

      {/* Font size */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-[var(--fg)]">Font Size: {content.font_size}px</label>
        <select
          value={content.font_size}
          onChange={(e) => onChange({ content: { ...content, font_size: parseInt(e.target.value) } })}
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
          onChange={(e) => onChange({ content: { ...content, font_weight: parseInt(e.target.value) } })}
          className="w-full px-3 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--fg)] text-sm focus:outline-none focus:border-[var(--accent)]"
        >
          <option value={300}>Light (300)</option>
          <option value={400}>Regular (400)</option>
          <option value={600}>Semibold (600)</option>
          <option value={700}>Bold (700)</option>
        </select>
      </div>

      {/* Color */}
      <ColorPicker
        value={content.color}
        onChange={(color) => onChange({ content: { ...content, color } })}
        label="Text Color"
      />

      {/* Layering */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-[var(--fg)]">Layer Order (Z-Index: {element.z_index})</label>
        <div className="flex gap-2">
          <button
            onClick={onMoveBackward}
            className="flex-1 px-3 py-2 rounded-lg bg-[var(--bg-elevated)] text-[var(--fg)] text-sm font-medium hover:bg-[var(--border)] transition-colors"
          >
            Send Back
          </button>
          <button
            onClick={onMoveForward}
            className="flex-1 px-3 py-2 rounded-lg bg-[var(--bg-elevated)] text-[var(--fg)] text-sm font-medium hover:bg-[var(--border)] transition-colors"
          >
            Bring Forward
          </button>
        </div>
      </div>

      {/* Position info */}
      <div className="text-xs text-[var(--muted)] p-2 bg-[var(--bg-elevated)] rounded-lg">
        Position: ({element.position.x}, {element.position.y}) | Size: {element.size.width}x{element.size.height}px
      </div>
    </div>
  );
}
