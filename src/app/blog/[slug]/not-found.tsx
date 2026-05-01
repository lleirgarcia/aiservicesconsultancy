import Link from "next/link";
import { blogT } from "@/i18n/blogServer";

export default function ArticleNotFound() {
  const t = blogT();
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-24 text-center">
      <p className="text-xs uppercase tracking-wider text-[var(--muted)] mb-4 label-accent inline-block">
        404
      </p>
      <h1 className="font-headline text-3xl md:text-4xl text-[var(--fg)] mb-6">
        {t.notFound.title}
      </h1>
      <Link
        href="/blog"
        className="inline-block mt-4 px-6 py-3 border border-[var(--accent)] text-[var(--fg)] rounded hover:bg-[var(--accent-dim)] transition-colors font-headline uppercase tracking-wide text-sm"
      >
        {t.notFound.cta}
      </Link>
    </div>
  );
}
