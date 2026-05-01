import type { Metadata } from "next";
import {
  countPublished,
  listPublished,
} from "@/services/blog/articleQueries";
import { ArticleList } from "@/components/blog/ArticleList";
import { EmptyState } from "@/components/blog/EmptyState";
import { blogT } from "@/i18n/blogServer";
import { readOptional } from "@/lib/env";

export const revalidate = 60;

const PAGE_SIZE = 10;

interface PageProps {
  searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  const t = blogT();
  const baseUrl = readOptional("BLOG_PUBLIC_SITE_URL")?.replace(/\/+$/, "");
  return {
    title: t.list.title,
    description: t.list.subtitle,
    alternates: baseUrl ? { canonical: `${baseUrl}/blog` } : undefined,
    openGraph: {
      title: t.list.title,
      description: t.list.subtitle,
      url: baseUrl ? `${baseUrl}/blog` : undefined,
      type: "website",
    },
  };
}

export default async function BlogIndexPage({ searchParams }: PageProps) {
  const t = blogT();
  const params = await searchParams;
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
  const offset = (page - 1) * PAGE_SIZE;

  let items: Awaited<ReturnType<typeof listPublished>> = [];
  let total = 0;
  let loadError: string | null = null;

  try {
    [items, total] = await Promise.all([
      listPublished({ limit: PAGE_SIZE, offset }),
      countPublished(),
    ]);
  } catch (e) {
    loadError = (e as Error).message;
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      <header className="mb-12 max-w-3xl">
        <p className="label-accent inline-block text-xs uppercase tracking-wider mb-4">
          {t.list.title}
        </p>
        <h1 className="font-headline text-4xl sm:text-5xl text-[var(--fg)] leading-tight mb-4">
          {t.list.subtitle}
        </h1>
      </header>

      {loadError ? (
        <p className="text-sm text-red-400">Error: {loadError}</p>
      ) : items.length === 0 ? (
        <EmptyState message={t.list.empty} />
      ) : (
        <ArticleList items={items} page={page} totalPages={totalPages} />
      )}
    </section>
  );
}
