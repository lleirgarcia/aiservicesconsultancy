"use client";

import { useTranslations } from "@/i18n/useTranslations";
import { generateElementId } from "@/utils/canvasUtils";

interface ElementPaletteProps {
  onAddText: (elementId: string) => void;
}

export function ElementPalette({ onAddText }: ElementPaletteProps) {
  const t = useTranslations();

  const handleAddText = () => {
    const elementId = generateElementId();
    onAddText(elementId);
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="text-sm font-semibold text-[var(--fg)] mb-3">Elements</h3>

        <button
          onClick={handleAddText}
          draggable={false}
          className="w-full px-4 py-3 rounded-lg bg-[var(--accent)] text-[var(--accent-on)] font-medium hover:bg-[var(--accent-dim)] border border-[var(--accent)] transition-colors"
        >
          {t("instagram_builder.buttons.addText")}
        </button>
      </div>

      <p className="text-xs text-[var(--muted)] p-3 bg-[var(--bg-section)] rounded-lg">
        Drag text onto the canvas to position it. Click to edit content.
      </p>
    </div>
  );
}
