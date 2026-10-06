import type { Metadata } from "next";
import type { ReactNode } from "react";

/* Landing anterior, archivada: fuera de sitemap y sin indexar. */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function ClassicLayout({ children }: { children: ReactNode }) {
  return children;
}
