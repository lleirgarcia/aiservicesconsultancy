"use client";

import { useTranslations } from "@/i18n/useTranslations";
import { generateElementId } from "@/utils/canvasUtils";

interface ElementPaletteProps {
  onAddText: (elementId: string) => void;
  onAddLine: (elementId: string) => void;
}

export function ElementPalette({ onAddText, onAddLine }: ElementPaletteProps) {
  const t = useTranslations();

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="text-sm font-semibold text-[var(--fg)] mb-3">Elements</h3>
        <div className="flex flex-col gap-2">
          <button
            onClick={() => onAddText(generateElementId())}
            className="w-full px-4 py-3 rounded-lg bg-[var(--accent)] text-[var(--accent-on)] font-medium hover:opacity-90 transition-opacity"
          >
            {t("instagram_builder.buttons.addText")}
          </button>
          <button
            onClick={() => onAddLine(generateElementId())}
            className="w-full px-4 py-3 rounded-lg border border-[var(--border)] text-[var(--fg)] font-medium hover:bg-[var(--bg-elevated)] transition-colors flex items-center justify-center gap-2"
          >
            <span className="inline-block w-8 h-0.5 bg-[var(--muted)]" />
            Línea divisoria
          </button>
        </div>
      </div>

      <p className="text-xs text-[var(--muted)] p-3 bg-[var(--bg-section)] rounded-lg">
        Arrastra para mover · Doble clic para editar texto · Handles para redimensionar
      </p>
    </div>
  );
}
