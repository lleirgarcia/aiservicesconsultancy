import type { Metadata } from "next";
import type { ReactNode } from "react";

/* Landing en pruebas: fuera de sitemap y sin indexar hasta que sustituya a la actual. */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function V2Layout({ children }: { children: ReactNode }) {
  return children;
}
