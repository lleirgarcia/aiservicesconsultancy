"use client";

import { useI18n } from "@/i18n/LocaleContext";

const GROTESK = "var(--font-space-grotesk), 'Space Grotesk', system-ui, sans-serif";
const JMONO = "var(--font-jetbrains), 'JetBrains Mono', ui-monospace, monospace";

const PHONE_TEL = "+34626572151";
const PHONE_DISPLAY = "626 572 151";
const WHATSAPP_URL = "https://wa.me/34626572151";

function WaIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="#25D366" aria-hidden>
      <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm5.3 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .1-3.2-.7-2.7-1.1-4.4-3.8-4.5-4-.1-.2-1.1-1.5-1.1-2.8 0-1.3.7-2 1-2.3.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.4 0 .5l-.3.5-.4.4c-.1.1-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.3 2.4 1.5.3.1.5.1.6-.1l.9-1c.2-.3.4-.2.6-.1l1.9.9c.3.1.5.2.5.3.1.2.1.7-.1 1.2z" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.906.339 1.849.573 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

/** Llamada directa, sin pasar por el chat ni por el formulario: justo debajo de "Proyectos realizados". */
/**
 * `ns`: grupo de textos. "callCtaEarly" va justo tras los casos reales (el
 * usuario solo ha visto el hero y los casos); "callCta" va al final, cuando
 * ya lo ha leído todo.
 */
export default function CallCta({ ns = "callCta" }: { ns?: "callCta" | "callCtaEarly" }) {
  const { t } = useI18n();
  return (
    <section className="px-6" style={{ paddingTop: 0, paddingBottom: "clamp(3rem, 7vh, 5rem)" }}>
      <div
        className="max-w-[1120px] mx-auto flex flex-col items-center text-center"
        style={{
          background: "var(--surface-2)",
          border: "1px solid var(--border)",
          borderRadius: 20,
          padding: "clamp(2rem, 5vh, 3rem) clamp(1.5rem, 5vw, 3rem)",
        }}
      >
        <span
          style={{
            fontFamily: JMONO,
            fontSize: "0.7rem",
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase" as const,
            color: "var(--muted)",
            border: "1px solid var(--border)",
            borderRadius: 999,
            padding: "0.3rem 0.8rem",
            marginBottom: "1.1rem",
          }}
        >
          {t(`v3.${ns}.badge`)}
        </span>

        <h2
          style={{
            fontFamily: GROTESK,
            fontSize: "clamp(1.3rem, 2.6vw, 1.75rem)",
            fontWeight: 700,
            color: "var(--fg)",
            margin: 0,
            maxWidth: "32ch",
          }}
        >
          {t(`v3.${ns}.heading`)}
        </h2>
        <p style={{ fontSize: "1rem", color: "var(--muted)", margin: "0.6rem 0 1.75rem" }}>{t(`v3.${ns}.sub`)}</p>

        <div className="flex flex-wrap items-center justify-center gap-3">
        <a
          href={`tel:${PHONE_TEL}`}
          className="inline-flex items-center gap-2.5 transition-opacity hover:opacity-85"
          style={{
            background: "var(--accent)",
            color: "var(--accent-on)",
            borderRadius: 999,
            padding: "0.9rem 1.6rem",
            fontFamily: GROTESK,
            fontWeight: 700,
            fontSize: "1rem",
            textDecoration: "none",
          }}
        >
          <PhoneIcon />
          {t(`v3.${ns}.button`)}
          <span style={{ fontFamily: JMONO, fontWeight: 500, opacity: 0.85 }}>{PHONE_DISPLAY}</span>
        </a>
        <a
          href={`${WHATSAPP_URL}?text=${encodeURIComponent(t("v3.ctaFinal.waText"))}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 transition-opacity hover:opacity-85"
          style={{
            background: "var(--surface)",
            color: "var(--fg)",
            border: "1.5px solid var(--border)",
            borderRadius: 999,
            padding: "0.85rem 1.5rem",
            fontFamily: GROTESK,
            fontWeight: 700,
            fontSize: "1rem",
            textDecoration: "none",
          }}
        >
          <WaIcon />
          {t("v3.hero.ctaWa")}
        </a>
        </div>
      </div>
    </section>
  );
}
