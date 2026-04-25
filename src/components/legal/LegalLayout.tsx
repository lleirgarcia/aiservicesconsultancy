import type { ReactNode } from "react";
import Link from "next/link";
import Logo from "@/components/ui/Logo";
import Footer from "@/components/sections/Footer";
import { EMPRESA } from "@/data/empresa";

type LegalLayoutProps = {
  title: string;
  intro?: string;
  children: ReactNode;
};

export default function LegalLayout({ title, intro, children }: LegalLayoutProps) {
  return (
    <div
      className="max-w-5xl mx-auto"
      style={{
        borderLeft: "1px solid var(--border)",
        borderRight: "1px solid var(--border)",
        minHeight: "100vh",
      }}
    >
      {/* Header */}
      <header
        className="px-5 sm:px-6 py-4 flex items-center justify-between gap-3 sm:gap-4"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <Link
          href="/"
          aria-label={`${EMPRESA.webDominio} — Inicio`}
          className="inline-flex shrink-0"
        >
          <Logo />
        </Link>
        <Link
          href="/"
          className="text-xs font-medium uppercase tracking-widest hover:opacity-70 transition-opacity"
          style={{ color: "var(--muted)" }}
        >
          ← Volver al inicio
        </Link>
      </header>

      {/* Título */}
      <div
        className="px-5 sm:px-8 py-10 sm:py-14 section-accent-left"
        style={{
          borderBottom: "1px solid var(--border)",
          background: "var(--bg-section)",
        }}
      >
        <p
          className="text-xs font-medium uppercase tracking-widest"
          style={{ color: "var(--muted)" }}
        >
          Información legal
        </p>
        <h1 className="text-2xl md:text-4xl font-bold leading-tight tracking-tight uppercase mt-3">
          {title}
        </h1>
        {intro ? (
          <p
            className="text-sm sm:text-base mt-4 max-w-2xl leading-relaxed"
            style={{ color: "var(--muted)" }}
          >
            {intro}
          </p>
        ) : null}
        <p
          className="text-xs font-medium uppercase tracking-widest mt-6"
          style={{ color: "var(--muted)" }}
        >
          Última actualización · {EMPRESA.ultimaActualizacion}
        </p>
      </div>

      {/* Contenido */}
      <article className="legal-prose px-5 sm:px-8 py-10 sm:py-14 max-w-3xl">
        {children}
      </article>

      <Footer />
    </div>
  );
}
