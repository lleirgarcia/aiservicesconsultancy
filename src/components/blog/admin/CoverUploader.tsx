"use client";

import Image from "next/image";
import { ChangeEvent, useRef, useState } from "react";
import { dictionaries, defaultLocale } from "@/i18n/dict";

interface CoverUploaderProps {
  articleId: string | null;
  value: string | null;
  onChange: (url: string | null) => void;
}

export function CoverUploader({
  articleId,
  value,
  onChange,
}: CoverUploaderProps) {
  const t = dictionaries[defaultLocale].blog.editor;
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const disabled = !articleId;

  async function handleSelect(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !articleId) return;
    setBusy(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("articleId", articleId);
      const res = await fetch("/api/blog/upload", {
        method: "POST",
        body: form,
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.reason ?? json.error ?? "upload_failed");
        return;
      }
      onChange(json.url as string);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div>
      <label className="block text-xs uppercase tracking-wider text-[var(--muted)] mb-2">
        {t.fields.cover}
      </label>
      <div
        className={`border border-dashed rounded p-4 ${
          disabled
            ? "border-[var(--border)] bg-[var(--bg-soft)]/50"
            : "border-[var(--border)] hover:border-[var(--accent)] cursor-pointer"
        }`}
        onClick={() => !disabled && inputRef.current?.click()}
      >
        {value ? (
          <div className="flex items-start gap-4">
            <div className="relative w-32 aspect-[16/9] rounded overflow-hidden border border-[var(--border)] flex-shrink-0">
              <Image
                src={value}
                alt="cover"
                fill
                className="object-cover"
                sizes="128px"
              />
            </div>
            <div className="flex flex-col gap-2 text-sm flex-1 min-w-0">
              <p className="text-[var(--muted)] truncate">{value}</p>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(null);
                }}
                className="self-start text-red-400 hover:text-red-300 text-xs uppercase tracking-wide"
              >
                Quitar portada
              </button>
            </div>
          </div>
        ) : disabled ? (
          <p className="text-sm text-[var(--muted)] text-center py-4">
            {t.hints.coverDisabled}
          </p>
        ) : (
          <p className="text-sm text-[var(--muted-hi)] text-center py-4">
            {busy
              ? t.hints.saving
              : "Click o arrastra una imagen (jpg/png/webp/avif, máx 5 MB)"}
          </p>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          onChange={handleSelect}
          disabled={disabled || busy}
          className="hidden"
        />
      </div>
      {error ? (
        <p className="text-xs text-red-400 mt-2" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
