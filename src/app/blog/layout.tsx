import Link from "next/link";
import { blogT } from "@/i18n/blogServer";
import Footer from "@/components/sections/Footer";
import type { ReactNode } from "react";

export default function BlogLayout({ children }: { children: ReactNode }) {
  const t = blogT();
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--fg)]">
      <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--bg)]/80 backdrop-blur">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          <Link
            href="/"
            className="font-headline text-sm sm:text-base text-[var(--fg)] hover:text-[var(--accent)] transition-colors"
          >
            ← Kroomix
          </Link>
          <Link
            href="/blog"
            className="font-headline uppercase tracking-wider text-xs sm:text-sm text-[var(--muted-hi)] hover:text-[var(--accent)] transition-colors"
          >
            {t.list.title}
          </Link>
        </div>
      </header>
      <main>{children}</main>
      <div className="border-t border-[var(--border)] mt-24">
        <Footer slim />
      </div>
    </div>
  );
}
