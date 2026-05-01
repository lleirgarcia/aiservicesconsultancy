"use client";

import { useState } from "react";
import { useTranslations } from "@/i18n/useTranslations";

interface SaveTemplateModalProps {
  isOpen: boolean;
  isLoading?: boolean;
  error?: string | null;
  onSave: (name: string, description?: string) => Promise<void>;
  onCancel: () => void;
}

export function SaveTemplateModal({
  isOpen,
  isLoading,
  error,
  onSave,
  onCancel,
}: SaveTemplateModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const t = useTranslations();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!name.trim()) {
      setLocalError("Template name is required");
      return;
    }

    try {
      await onSave(name.trim(), description.trim() || undefined);
      setName("");
      setDescription("");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save template";
      setLocalError(message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[var(--bg)] rounded-lg border border-[var(--border)] p-6 max-w-md w-full mx-4">
        <h2 className="text-lg font-semibold text-[var(--fg)] mb-4">
          {t("instagram_builder.buttons.save")}
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Template name */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-[var(--fg)]">
              {t("instagram_builder.labels.templateName")}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("instagram_builder.placeholders.templateName")}
              className="px-3 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--fg)] text-sm placeholder-[var(--muted)] focus:outline-none focus:border-[var(--accent)]"
              autoFocus
              maxLength={100}
            />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-[var(--fg)]">
              {t("instagram_builder.labels.description")} (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("instagram_builder.placeholders.description")}
              className="px-3 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--fg)] text-sm placeholder-[var(--muted)] focus:outline-none focus:border-[var(--accent)]"
              rows={3}
              maxLength={500}
            />
          </div>

          {/* Error message */}
          {(error || localError) && (
            <div className="px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {error || localError}
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="flex-1 px-4 py-2 rounded-lg border border-[var(--border)] text-[var(--fg)] font-medium hover:bg-[var(--bg-elevated)] transition-colors disabled:opacity-50"
            >
              {t("instagram_builder.buttons.cancel")}
            </button>
            <button
              type="submit"
              disabled={isLoading || !name.trim()}
              className="flex-1 px-4 py-2 rounded-lg bg-[var(--accent)] text-[var(--accent-on)] font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {isLoading ? "Saving..." : t("instagram_builder.buttons.save")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
