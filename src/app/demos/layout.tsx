import type { Metadata } from "next";
import DemosHeader from "./DemosHeader";

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
      <DemosHeader />
      <main className="flex-1">{children}</main>
    </div>
  );
}
