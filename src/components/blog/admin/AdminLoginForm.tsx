"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { dictionaries, defaultLocale } from "@/i18n/dict";

interface AdminLoginFormProps {
  from?: string;
}

export function AdminLoginForm({ from }: AdminLoginFormProps) {
  const t = dictionaries[defaultLocale].blog.admin.login;
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/blog/auth", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        const target = isSafeRedirect(from) ? from! : "/blog/admin";
        router.push(target);
        router.refresh();
        return;
      }
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (res.status === 429 || json.error === "too_many_attempts") {
        setError(t.errorRate);
      } else {
        setError(t.errorInvalid);
      }
    } catch {
      setError(t.errorInvalid);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="w-full max-w-sm border border-[var(--border)] rounded bg-[var(--bg-soft)] p-6 sm:p-8"
    >
      <h1 className="font-headline text-2xl text-[var(--fg)] mb-6 label-accent">
        {t.title}
      </h1>
      <label className="block text-xs uppercase tracking-wider text-[var(--muted)] mb-2">
        {t.passwordLabel}
      </label>
      <input
        type="password"
        autoFocus
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        disabled={busy}
        className="w-full mb-4"
        autoComplete="current-password"
        required
      />
      {error ? (
        <p className="text-sm text-red-400 mb-4" role="alert">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={busy || !password}
        className="w-full px-4 py-2 border border-[var(--accent)] text-[var(--fg)] rounded hover:bg-[var(--accent-dim)] transition-colors font-headline uppercase tracking-wide text-sm disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {busy ? "…" : t.submit}
      </button>
    </form>
  );
}

function isSafeRedirect(from?: string): boolean {
  if (!from) return false;
  if (!from.startsWith("/blog/admin")) return false;
  if (from.includes("//") || from.includes(":")) return false;
  return true;
}
