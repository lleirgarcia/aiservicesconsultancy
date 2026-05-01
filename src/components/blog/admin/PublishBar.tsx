"use client";

import { ArticleStatus } from "@/types/blog";
import { dictionaries, defaultLocale } from "@/i18n/dict";

interface PublishBarProps {
  status: ArticleStatus;
  isNew: boolean;
  isDirty: boolean;
  isSaving: boolean;
  isPreviewing: boolean;
  errorMessage: string | null;
  canPublish: boolean;
  onSaveDraft: () => void;
  onTogglePreview: () => void;
  onPublish: () => void;
  onUnpublish: () => void;
}

export function PublishBar({
  status,
  isNew,
  isDirty,
  isSaving,
  isPreviewing,
  errorMessage,
  canPublish,
  onSaveDraft,
  onTogglePreview,
  onPublish,
  onUnpublish,
}: PublishBarProps) {
  const t = dictionaries[defaultLocale].blog.editor;
  const isPublished = status === "published";

  return (
    <div className="sticky bottom-0 left-0 right-0 z-20 border-t border-[var(--border)] bg-[var(--bg-soft)]/95 backdrop-blur">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onSaveDraft}
          disabled={isSaving || (!isDirty && !isNew)}
          className="px-4 py-2 border border-[var(--border)] hover:border-[var(--fg)] text-[var(--fg)] rounded text-sm disabled:opacity-50"
        >
          {isSaving ? t.hints.saving : t.actions.saveDraft}
        </button>
        <button
          type="button"
          onClick={onTogglePreview}
          disabled={isNew}
          className="px-4 py-2 border border-[var(--border)] hover:border-[var(--fg)] text-[var(--fg)] rounded text-sm disabled:opacity-50"
        >
          {isPreviewing ? t.actions.edit : t.actions.preview}
        </button>
        <div className="flex-1" />
        {errorMessage ? (
          <span className="text-xs text-red-400 mr-2">{errorMessage}</span>
        ) : null}
        {isPublished ? (
          <button
            type="button"
            onClick={onUnpublish}
            disabled={isSaving}
            className="px-4 py-2 border border-[var(--border)] hover:border-red-400 text-red-400 hover:text-red-300 rounded text-sm uppercase tracking-wide disabled:opacity-50"
          >
            {t.actions.unpublish}
          </button>
        ) : (
          <button
            type="button"
            onClick={onPublish}
            disabled={isSaving || !canPublish}
            className="px-4 py-2 border border-[var(--accent)] bg-[var(--accent-dim)] text-[var(--fg)] rounded text-sm font-headline uppercase tracking-wide disabled:opacity-50 disabled:cursor-not-allowed"
            title={
              !canPublish
                ? "Necesitas título, resumen, contenido y portada para publicar"
                : undefined
            }
          >
            {t.actions.publish}
          </button>
        )}
      </div>
    </div>
  );
}
