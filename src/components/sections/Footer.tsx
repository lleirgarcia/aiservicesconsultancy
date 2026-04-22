import type { ReactElement } from "react";
import Logo from "@/components/ui/Logo";

const SOCIALS: { label: string; href: string; icon: ReactElement }[] = [
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/",
    icon: (
      <svg
        viewBox="0 0 24 24"
        width="18"
        height="18"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M4.98 3.5C4.98 4.88 3.87 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM.22 8h4.56v14H.22V8zm7.56 0h4.37v1.92h.06c.61-1.15 2.1-2.36 4.32-2.36 4.62 0 5.47 3.04 5.47 7v7.44h-4.56v-6.6c0-1.57-.03-3.6-2.2-3.6-2.2 0-2.54 1.72-2.54 3.49V22H7.78V8z" />
      </svg>
    ),
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com/",
    icon: (
      <svg
        viewBox="0 0 24 24"
        width="18"
        height="18"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    label: "YouTube",
    href: "https://www.youtube.com/",
    icon: (
      <svg
        viewBox="0 0 24 24"
        width="20"
        height="20"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8zM9.6 15.6V8.4L15.8 12l-6.2 3.6z" />
      </svg>
    ),
  },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer
      className="px-6 py-10 max-w-4xl mx-auto flex flex-col gap-8"
      style={{ borderTop: "1px solid var(--border)", color: "var(--muted)" }}
    >
      {/* Fila 1: tagline + redes sociales */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-sm">
        <p className="max-w-xl leading-relaxed">
          Optimizamos el caos para crear claridad en tu negocio · Osona, Barcelona
        </p>
        <div className="flex items-center gap-5 shrink-0">
          {SOCIALS.map(({ label, href, icon }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              className="transition-opacity hover:opacity-60"
              style={{ color: "var(--muted)", display: "inline-flex" }}
            >
              {icon}
            </a>
          ))}
        </div>
      </div>

      {/* Filas 2 y 3: logo + copyright centrados, juntos */}
      <div className="flex flex-col items-center gap-2">
        <Logo size={26} />
        <p className="text-xs">
          © {year} · Todos los derechos reservados
        </p>
      </div>
    </footer>
  );
}
