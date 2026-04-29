"use client";

import { useState } from "react";
import { TemplateConfig } from "@/types/instagram-builder";

interface ImportTemplateModalProps {
  isOpen: boolean;
  isLoading?: boolean;
  error?: string | null;
  onImport: (name: string, config: TemplateConfig) => void;
  onCancel: () => void;
}

export function ImportTemplateModal({
  isOpen,
  isLoading = false,
  error,
  onImport,
  onCancel,
}: ImportTemplateModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [templateName, setTemplateName] = useState("");
  const [importError, setImportError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportError(null);

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);

      if (!parsed.canvas || !Array.isArray(parsed.elements)) {
        setImportError("Invalid template file format");
        return;
      }

      setSelectedFile(file);
      setTemplateName(parsed.name || file.name.replace(".json", ""));
    } catch (err) {
      setImportError(
        err instanceof Error ? err.message : "Failed to parse template file"
      );
    }
  };

  const handleImport = () => {
    if (!selectedFile || !templateName.trim()) {
      setImportError("Template name is required");
      return;
    }

    selectedFile.text().then((text) => {
      try {
        const config = JSON.parse(text) as TemplateConfig;
        onImport(templateName, config);
      } catch {
        setImportError("Failed to import template");
      }
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--bg-section)] rounded-lg border border-[var(--border)] max-w-md w-full p-6">
        <h2 className="text-xl font-bold text-[var(--fg)] mb-4">Import Template</h2>

        {/* File input */}
        <div className="mb-6">
          <label className="text-sm font-medium text-[var(--fg)] block mb-2">
            Select JSON File
          </label>
          <input
            type="file"
            accept=".json"
            onChange={handleFileSelect}
            disabled={isLoading}
            className="w-full px-3 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--fg)] text-sm focus:outline-none focus:border-[var(--accent)]"
          />
        </div>

        {/* Template name */}
        {selectedFile && (
          <div className="mb-6">
            <label className="text-sm font-medium text-[var(--fg)] block mb-2">
              Template Name
            </label>
            <input
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              disabled={isLoading}
              className="w-full px-3 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--fg)] text-sm focus:outline-none focus:border-[var(--accent)]"
              maxLength={100}
            />
          </div>
        )}

        {/* Error message */}
        {(importError || error) && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-6">
            <p className="text-red-400 text-sm">{importError || error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleImport}
            disabled={!selectedFile || !templateName.trim() || isLoading}
            className="flex-1 px-4 py-3 rounded-lg bg-[var(--accent)] text-[var(--accent-on)] font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
          >
            {isLoading ? "Importing..." : "Import"}
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
