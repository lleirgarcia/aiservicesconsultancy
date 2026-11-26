import type { Metadata } from "next";
import Link from "next/link";
import BrandLogo from "../_landing/BrandLogo";

export const metadata: Metadata = {
  title: "Demos — Kroomix",
  description: "Ejemplos interactivos de soluciones reales aplicadas a problemas concretos.",
  robots: { index: false, follow: false },
};

const GROTESK = "var(--font-space-grotesk), 'Space Grotesk', system-ui, sans-serif";

/* Mismo tema y cabecera que la landing (v3-theme: claro, acento azul, Space Grotesk). */
export default function DemosLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="v3-theme min-h-screen flex flex-col" style={{ fontFamily: GROTESK }}>
      <header
        className="sticky top-0 z-50 w-full"
        style={{
          background: "var(--surface-glass)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div className="max-w-[1120px] mx-auto px-6 h-16 flex items-center justify-between gap-4">
          <Link href="/" aria-label="Kroomix" className="inline-flex shrink-0 items-center">
            <BrandLogo height={44} ratio={3.42} />
          </Link>
          <div className="flex items-center gap-4 sm:gap-6">
            <span
              className="hidden sm:inline text-xs font-medium uppercase tracking-widest"
              style={{ color: "var(--muted)" }}
            >
              Datos de ejemplo
            </span>
            <Link
              href="/"
              className="text-xs font-medium uppercase tracking-widest"
              style={{ color: "var(--accent)" }}
            >
              ← Volver a kroomix.com
            </Link>
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
