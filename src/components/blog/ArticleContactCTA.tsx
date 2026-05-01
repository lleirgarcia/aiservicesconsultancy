"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

const PHONE_DISPLAY = "+34 626 572 151";
const PHONE_TEL = "+34626572151";
const WHATSAPP_URL = "https://wa.me/34626572151";
const EMAIL_PRIMARY = "kromix@kroomix.com";

export function ArticleContactCTA({ label }: { label: string }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  const modal = open && mounted && createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Contactar con Kroomix"
      onClick={() => setOpen(false)}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.55)",
        backdropFilter: "blur(12px) saturate(120%)",
        WebkitBackdropFilter: "blur(12px) saturate(120%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: "1.5rem",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm"
        style={{
          background: "var(--bg)",
          color: "var(--fg)",
          border: "1px solid var(--border)",
          borderRadius: 2,
          boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
        }}
      >
        <div
          className="px-6 py-5 flex items-center justify-between"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <span className="text-xs font-medium uppercase tracking-widest">Contactar</span>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Cerrar"
            className="transition-opacity hover:opacity-60 cursor-pointer"
            style={{ background: "transparent", border: "none", padding: 0, color: "var(--muted)", fontSize: "1rem", lineHeight: 1 }}
          >
            ×
          </button>
        </div>

        <a
          href={`tel:${PHONE_TEL}`}
          onClick={() => setOpen(false)}
          className="flex flex-col gap-1 px-6 py-5 transition-colors hover:bg-[var(--bg-soft)]"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <span className="text-xs font-medium uppercase tracking-widest" style={{ color: "var(--accent)" }}>Llamar</span>
          <span className="text-sm" style={{ color: "var(--muted)" }}>{PHONE_DISPLAY}</span>
        </a>

        <a
          href={`mailto:${EMAIL_PRIMARY}`}
          onClick={() => setOpen(false)}
          className="flex flex-col gap-1 px-6 py-5 transition-colors hover:bg-[var(--bg-soft)]"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <span className="text-xs font-medium uppercase tracking-widest" style={{ color: "var(--accent)" }}>Email</span>
          <span className="text-sm" style={{ color: "var(--muted)" }}>{EMAIL_PRIMARY}</span>
        </a>

        <a
          href={WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => setOpen(false)}
          className="flex flex-col gap-1 px-6 py-5 transition-colors hover:bg-[var(--bg-soft)]"
        >
          <span className="text-xs font-medium uppercase tracking-widest" style={{ color: "var(--accent)" }}>WhatsApp</span>
        </a>
      </div>
    </div>,
    document.body
  );

  return (
    <>
      <div
        className="max-w-2xl mx-auto mt-16 mb-4 rounded-lg px-8 py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6"
        style={{ background: "var(--bg-soft)", border: "1px solid var(--border)" }}
      >
        <div className="flex flex-col gap-1">
          <span className="text-xs uppercase tracking-widest font-medium" style={{ color: "var(--accent)" }}>Kroomix</span>
          <p className="text-[var(--fg)] font-medium leading-snug">{label}</p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="shrink-0 px-5 py-2.5 text-sm font-medium uppercase tracking-widest transition-opacity hover:opacity-80 cursor-pointer"
          style={{
            background: "var(--accent)",
            color: "#000",
            border: "none",
            borderRadius: 2,
          }}
        >
          Hablamos
        </button>
      </div>
      {modal}
    </>
  );
}
