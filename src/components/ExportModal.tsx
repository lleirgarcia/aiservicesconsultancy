"use client";

import { useState } from "react";

interface ExportModalProps {
  isOpen: boolean;
  isLoading?: boolean;
  error?: string | null;
  onExport: (format: "png" | "jpeg") => Promise<void>;
  onCancel: () => void;
}

export function ExportModal({ isOpen, isLoading, error, onExport, onCancel }: ExportModalProps) {
  const [format, setFormat] = useState<"png" | "jpeg">("png");
  const [quality, setQuality] = useState(95);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[var(--bg)] rounded-lg border border-[var(--border)] p-6 max-w-md w-full mx-4">
        <h2 className="text-lg font-semibold text-[var(--fg)] mb-4">Download Image</h2>

        <div className="flex flex-col gap-4">
          {/* Format selection */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-[var(--fg)]">Format</label>
            <div className="flex gap-3">
              {(["png", "jpeg"] as const).map((f) => (
                <label key={f} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="format"
                    value={f}
                    checked={format === f}
                    onChange={(e) => setFormat(e.target.value as "png" | "jpeg")}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-[var(--fg)]">{f.toUpperCase()}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Quality (JPEG only) */}
          {format === "jpeg" && (
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-[var(--fg)]">
                Quality: {quality}%
              </label>
              <input
                type="range"
                min="50"
                max="100"
                value={quality}
                onChange={(e) => setQuality(parseInt(e.target.value))}
                className="w-full"
              />
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={onCancel}
              disabled={isLoading}
              className="flex-1 px-4 py-2 rounded-lg border border-[var(--border)] text-[var(--fg)] font-medium hover:bg-[var(--bg-elevated)] transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={() => onExport(format)}
              disabled={isLoading}
              className="flex-1 px-4 py-2 rounded-lg bg-[var(--accent)] text-[var(--accent-on)] font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {isLoading ? "Exporting..." : "Download"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
