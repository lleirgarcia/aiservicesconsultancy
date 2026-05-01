"use client";

import { Template } from "@/types/instagram-builder";

interface ExportTemplateModalProps {
  isOpen: boolean;
  template: Template | null;
  isLoading?: boolean;
  onExport: () => void;
  onCancel: () => void;
}

export function ExportTemplateModal({
  isOpen,
  template,
  isLoading = false,
  onExport,
  onCancel,
}: ExportTemplateModalProps) {
  if (!isOpen || !template) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--bg-section)] rounded-lg border border-[var(--border)] max-w-md w-full p-6">
        <h2 className="text-xl font-bold text-[var(--fg)] mb-4">Export Template</h2>

        <div className="bg-[var(--bg-elevated)] rounded-lg p-4 mb-6">
          <p className="text-sm text-[var(--muted)] mb-2">Template Name</p>
          <p className="text-[var(--fg)] font-medium">{template.name}</p>
        </div>

        <div className="bg-[var(--bg-elevated)] rounded-lg p-4 mb-6">
          <p className="text-sm text-[var(--muted)] mb-1">Description</p>
          <p className="text-[var(--fg)] text-sm">{template.description || "No description"}</p>
        </div>

        <div className="bg-[var(--bg-elevated)] rounded-lg p-4 mb-6">
          <p className="text-sm text-[var(--muted)] mb-1">Format</p>
          <p className="text-[var(--fg)] text-sm">JSON (.json)</p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onExport}
            disabled={isLoading}
            className="flex-1 px-4 py-3 rounded-lg bg-[var(--accent)] text-[var(--accent-on)] font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
          >
            {isLoading ? "Exporting..." : "Download"}
          </button>
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 px-4 py-3 rounded-lg border border-[var(--border)] text-[var(--fg)] font-medium hover:bg-[var(--bg-elevated)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
