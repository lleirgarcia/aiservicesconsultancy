"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useI18n } from "@/i18n/LocaleContext";

const PHONE_TEL = "+34626572151";
const WHATSAPP_URL = "https://wa.me/34626572151";
const EMAIL_PRIMARY = "hola@kroomix.com";

const GROTESK = "var(--font-space-grotesk), 'Space Grotesk', system-ui, sans-serif";
const BLUE = "#0d6ef2";
const AMBER = "#f59e0b";
const GREEN = "#16a34a";

/** Iconos de línea de cada vía de contacto, mismo trazo que el resto de /v2. */
function OptionIcon({ name }: { name: "phone" | "mail" | "wa" }) {
  const paths: Record<string, React.ReactNode> = {
    phone: (
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.906.339 1.849.573 2.81.7A2 2 0 0 1 22 16.92z" />
    ),
    mail: (
      <>
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <path d="m22 6-10 7L2 6" />
      </>
    ),
    wa: <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />,
  };
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {paths[name]}
    </svg>
  );
}

/** Badge circular de color, igual al patrón de HeaderIcon/RowIcon usado en Soluciones y el tablero. */
function OptionBadge({ icon, color }: { icon: "phone" | "mail" | "wa"; color: string }) {
  return (
    <span
      aria-hidden
      className="flex items-center justify-center shrink-0"
      style={{ width: 34, height: 34, borderRadius: 9, background: `color-mix(in srgb, ${color} 14%, var(--surface))`, color }}
    >
      <OptionIcon name={icon} />
    </span>
  );
}

export default function ContactTrigger() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const isV3 = !!portalTarget && portalTarget !== document.body;

  useEffect(() => {
    setMounted(true);
    // El modal se monta en portal: si el botón vive dentro de la landing clara
    // (.v3-theme), lo portamos ahí mismo para heredar sus variables de color
    // (--surface, --border...). Si no, cae en document.body (landing legacy).
    const v3Ancestor = triggerRef.current?.closest(".v3-theme");
    setPortalTarget((v3Ancestor as HTMLElement) ?? document.body);
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

  const options: {
    key: string;
    icon: "phone" | "mail" | "wa";
    color: string;
    label: string;
    sub?: string;
    href?: string;
    external?: boolean;
    onSelect?: () => void;
  }[] = [
    { key: "call", icon: "phone", color: BLUE, label: t("contact.call"), href: `tel:${PHONE_TEL}` },
    { key: "email", icon: "mail", color: AMBER, label: t("contact.email"), href: `mailto:${EMAIL_PRIMARY}` },
    {
      key: "wa",
      icon: "wa",
      color: GREEN,
      label: t("contact.wa"),
      href: `${WHATSAPP_URL}?text=${encodeURIComponent(t("contact.waText"))}`,
      external: true,
    },
  ];

  const modal = open && mounted && portalTarget && createPortal(
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
      {isV3 && (
        <style>{`
          .kx-contact-row:hover { background: color-mix(in srgb, var(--row-color) 8%, var(--surface)); }
        `}</style>
      )}
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm"
        style={
          isV3
            ? {
                background: "var(--surface)",
                color: "var(--fg)",
                border: "1px solid var(--border)",
                borderRadius: 16,
                boxShadow: "0 16px 40px rgba(16,20,24,0.18)",
                overflow: "hidden",
              }
            : {
                background: "var(--bg)",
                color: "var(--fg)",
                border: "1px solid var(--border)",
                borderRadius: 2,
                boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
              }
        }
      >
        <div
          className="px-6 py-5 flex items-center justify-between"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <span
            className="text-xs font-medium uppercase tracking-widest"
            style={isV3 ? { fontFamily: GROTESK, fontWeight: 700, color: "var(--fg)" } : undefined}
          >
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

        {options.map((opt) => {
          const content = isV3 ? (
            <div className="flex items-center gap-3">
              <OptionBadge icon={opt.icon} color={opt.color} />
              <div>
                <span style={{ fontFamily: GROTESK, fontSize: "0.92rem", fontWeight: 600, color: "var(--fg)" }}>{opt.label}</span>
                {opt.sub && <p style={{ fontSize: "0.78rem", color: "var(--muted)", margin: "0.1rem 0 0" }}>{opt.sub}</p>}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium uppercase tracking-widest" style={{ color: "var(--accent)" }}>
                {opt.label}
              </span>
              {opt.sub && <span className="text-sm" style={{ color: "var(--muted)" }}>{opt.sub}</span>}
            </div>
          );

          const isLast = opt.key === options[options.length - 1].key;
          const rowStyle = {
            borderBottom: isLast ? "none" : "1px solid var(--border)",
            ...(isV3 ? ({ "--row-color": opt.color } as React.CSSProperties) : {}),
          };
          const rowClassName = `flex w-full items-center px-6 py-4 transition-colors${isV3 ? " kx-contact-row" : ""}`;

          if (opt.href) {
            return (
              <a
                key={opt.key}
                href={opt.href}
                target={opt.external ? "_blank" : undefined}
                rel={opt.external ? "noopener noreferrer" : undefined}
                onClick={() => setOpen(false)}
                className={rowClassName}
                style={rowStyle}
              >
                {content}
              </a>
            );
          }
          return (
            <button
              key={opt.key}
              type="button"
              onClick={() => {
                setOpen(false);
                opt.onSelect?.();
              }}
              className={`${rowClassName} text-left cursor-pointer`}
              style={{ ...rowStyle, background: "transparent", border: "none" }}
            >
              {content}
            </button>
          );
        })}
      </div>
    </div>,
    portalTarget
  );

  return (
    <>
      <button
        ref={triggerRef}
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
