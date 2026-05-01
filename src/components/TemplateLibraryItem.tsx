"use client";

import { Template } from "@/types/instagram-builder";
import { useTranslations } from "@/i18n/useTranslations";

interface TemplateLibraryItemProps {
  template: Template;
  onSelect: () => void;
  onDelete: () => Promise<void>;
  onExport?: () => void;
}

export function TemplateLibraryItem({
  template,
  onSelect,
  onDelete,
  onExport,
}: TemplateLibraryItemProps) {
  const t = useTranslations();

  const createdDate = new Date(template.created_at).toLocaleDateString();

  return (
    <div className="p-4 bg-[var(--bg-section)] border border-[var(--border)] rounded-lg hover:border-[var(--accent)] transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h3 className="font-semibold text-[var(--fg)] mb-1">{template.name}</h3>
          {template.description && (
            <p className="text-sm text-[var(--muted)] mb-2">{template.description}</p>
          )}
          <p className="text-xs text-[var(--muted)]">Created: {createdDate}</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onSelect}
            className="px-4 py-2 rounded-lg bg-[var(--accent)] text-[var(--accent-on)] text-sm font-medium hover:opacity-90 transition-opacity whitespace-nowrap"
          >
            {t("instagram_builder.buttons.load")}
          </button>
          {onExport && (
            <button
              onClick={onExport}
              className="px-3 py-2 rounded-lg bg-[var(--bg-elevated)] text-[var(--fg)] text-sm font-medium hover:bg-[var(--border)] transition-colors whitespace-nowrap"
            >
              {t("instagram_builder.buttons.export")}
            </button>
          )}
          <button
            onClick={onDelete}
            className="px-3 py-2 rounded-lg bg-red-500/10 text-red-400 text-sm font-medium hover:bg-red-500/20 border border-red-500/30 whitespace-nowrap"
          >
            {t("instagram_builder.buttons.delete")}
          </button>
        </div>
      </div>
    </div>
  );
}
