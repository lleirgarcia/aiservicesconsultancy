import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Demos — Kroomix",
  description: "Ejemplos interactivos de soluciones reales aplicadas a problemas concretos.",
  robots: { index: false, follow: false },
};

export default function DemosLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg)" }}>
      <header
        className="sticky top-0 z-40 px-5 sm:px-8 h-16 sm:h-[4.5rem] flex items-center justify-between"
        style={{
          background: "var(--bg)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <Link
          href="/demos"
          className="font-headline text-base sm:text-lg"
          style={{ color: "var(--fg)", letterSpacing: "-0.02em" }}
        >
          Kroomix · Demos
        </Link>
        <div className="flex items-center gap-3 sm:gap-5">
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
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
