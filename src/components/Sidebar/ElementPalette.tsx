"use client";

import { useTranslations } from "@/i18n/useTranslations";
import { generateElementId } from "@/utils/canvasUtils";
import { ShapeConfig } from "@/types/instagram-builder";

type ShapeKind = ShapeConfig["type"] | "rounded-rect";

interface ElementPaletteProps {
  onAddText: (elementId: string) => void;
  onAddShape: (elementId: string, kind: ShapeKind) => void;
}

const SHAPES: { kind: ShapeKind; label: string; icon: React.ReactNode }[] = [
  {
    kind: "rectangle",
    label: "Rectángulo",
    icon: <span className="inline-block w-6 h-4 bg-[var(--muted)]" />,
  },
  {
    kind: "rounded-rect",
    label: "Caja redondeada",
    icon: <span className="inline-block w-6 h-4 rounded-md bg-[var(--muted)]" />,
  },
  {
    kind: "circle",
    label: "Círculo",
    icon: <span className="inline-block w-5 h-5 rounded-full bg-[var(--muted)]" />,
  },
  {
    kind: "ellipse",
    label: "Elipse",
    icon: <span className="inline-block w-7 h-4 rounded-full bg-[var(--muted)]" />,
  },
  {
    kind: "triangle",
    label: "Triángulo",
    icon: (
      <svg viewBox="0 0 20 20" className="w-5 h-5" fill="currentColor">
        <polygon points="10,2 18,18 2,18" />
      </svg>
    ),
  },
  {
    kind: "diamond",
    label: "Rombo",
    icon: (
      <svg viewBox="0 0 20 20" className="w-5 h-5" fill="currentColor">
        <polygon points="10,2 18,10 10,18 2,10" />
      </svg>
    ),
  },
  {
    kind: "pentagon",
    label: "Pentágono",
    icon: (
      <svg viewBox="0 0 20 20" className="w-5 h-5" fill="currentColor">
        <polygon points="10,2 19,8 15.5,18 4.5,18 1,8" />
      </svg>
    ),
  },
  {
    kind: "hexagon",
    label: "Hexágono",
    icon: (
      <svg viewBox="0 0 20 20" className="w-5 h-5" fill="currentColor">
        <polygon points="5,2 15,2 19,10 15,18 5,18 1,10" />
      </svg>
    ),
  },
  {
    kind: "star",
    label: "Estrella",
    icon: (
      <svg viewBox="0 0 20 20" className="w-5 h-5" fill="currentColor">
        <polygon points="10,1 12.6,7.5 19.5,7.7 14,12 16.2,18.8 10,14.8 3.8,18.8 6,12 0.5,7.7 7.4,7.5" />
      </svg>
    ),
  },
  {
    kind: "heart",
    label: "Corazón",
    icon: (
      <svg viewBox="0 0 20 20" className="w-5 h-5" fill="currentColor">
        <path d="M10 18s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 17 8c0 5.5-7 10-7 10z" />
      </svg>
    ),
  },
  {
    kind: "arrow",
    label: "Flecha",
    icon: (
      <svg viewBox="0 0 20 20" className="w-6 h-5" fill="currentColor">
        <polygon points="0,7 12,7 12,3 19,10 12,17 12,13 0,13" />
      </svg>
    ),
  },
  {
    kind: "line",
    label: "Línea",
    icon: <span className="inline-block w-6 h-0.5 bg-[var(--muted)]" />,
  },
];

export function ElementPalette({ onAddText, onAddShape }: ElementPaletteProps) {
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
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-[var(--fg)] mb-3">Formas</h3>
        <div className="grid grid-cols-3 gap-2">
          {SHAPES.map(({ kind, label, icon }) => (
            <button
              key={kind}
              onClick={() => onAddShape(generateElementId(), kind)}
              className="flex flex-col items-center justify-center gap-1 px-2 py-3 rounded-lg border border-[var(--border)] text-[var(--fg)] text-xs hover:bg-[var(--bg-elevated)] transition-colors"
              title={label}
            >
              <span className="text-[var(--muted)]">{icon}</span>
              <span className="leading-tight text-center">{label}</span>
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs text-[var(--muted)] p-3 bg-[var(--bg-section)] rounded-lg">
        Arrastra para mover · Doble clic para editar texto · Handles para redimensionar
      </p>
    </div>
  );
}
