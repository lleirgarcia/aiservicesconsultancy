"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useI18n } from "@/i18n/LocaleContext";

const PHONE_DISPLAY = "+34 626 572 151";
const PHONE_TEL = "+34626572151";
const WHATSAPP_URL = "https://wa.me/34626572151";
const EMAIL_PRIMARY = "kromix@kroomix.com";

export default function ContactTrigger() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  const modal = open && mounted && createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t("contact.dialog")}
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
          <span className="text-xs font-medium uppercase tracking-widest">
            {t("contact.dialog")}
          </span>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label={t("chat.close")}
            className="transition-opacity hover:opacity-60 cursor-pointer"
            style={{
              background: "transparent",
              border: "none",
              padding: 0,
              color: "var(--muted)",
              fontSize: "1rem",
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        <a
          href={`tel:${PHONE_TEL}`}
          onClick={() => setOpen(false)}
          className="flex flex-col gap-1 px-6 py-5 transition-colors"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <span className="text-xs font-medium uppercase tracking-widest" style={{ color: "var(--accent)" }}>
            {t("contact.call")}
          </span>
          <span className="text-sm" style={{ color: "var(--muted)" }}>
            {PHONE_DISPLAY}
          </span>
        </a>

        <a
          href={`mailto:${EMAIL_PRIMARY}`}
          onClick={() => setOpen(false)}
          className="flex flex-col gap-1 px-6 py-5 transition-colors"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <span className="text-xs font-medium uppercase tracking-widest" style={{ color: "var(--accent)" }}>
            {t("contact.email")}
          </span>
          <span className="text-sm" style={{ color: "var(--muted)" }}>
            {EMAIL_PRIMARY}
          </span>
        </a>

        <a
          href={WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => setOpen(false)}
          className="flex flex-col gap-1 px-6 py-5 transition-colors"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <span className="text-xs font-medium uppercase tracking-widest" style={{ color: "var(--accent)" }}>
            {t("contact.wa")}
          </span>
        </a>

        <button
          type="button"
          onClick={() => {
            setOpen(false);
            const el = document.getElementById("contacto");
            if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
          }}
          className="flex flex-col gap-1 px-6 py-5 transition-colors w-full text-left cursor-pointer"
          style={{ background: "transparent", border: "none" }}
        >
          <span className="text-xs font-medium uppercase tracking-widest" style={{ color: "var(--accent)" }}>
            Hablar con asistente
          </span>
          <span className="text-sm" style={{ color: "var(--muted)" }}>
            Kromi, el asistente virtual
          </span>
        </button>
      </div>
    </div>,
    document.body
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="transition-opacity hover:opacity-60 cursor-pointer"
        style={{ background: "transparent", border: "none", padding: 0 }}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <span
          className="text-xs font-medium uppercase tracking-widest"
          style={{ color: "var(--muted)" }}
        >
          {t("contact.trigger")}
        </span>
      </button>

      {modal}
    </>
  );
}
