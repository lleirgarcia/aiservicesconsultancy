import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  getBySlug,
  listAllPublishedSlugs,
} from "@/services/blog/articleQueries";
import { ArticleContent } from "@/components/blog/ArticleContent";
import { ArticleMeta } from "@/components/blog/ArticleMeta";
import { blogT } from "@/i18n/blogServer";
import { readOptional } from "@/lib/env";

export const revalidate = 60;
export const dynamicParams = true;

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  try {
    const slugs = await listAllPublishedSlugs();
    return slugs.map(({ slug }) => ({ slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: RouteParams): Promise<Metadata> {
  const { slug } = await params;
  const article = await getBySlug(slug).catch(() => null);
  if (!article) {
    return { title: "Artículo no encontrado" };
  }
  const baseUrl = readOptional("BLOG_PUBLIC_SITE_URL")?.replace(/\/+$/, "");
  const canonical = baseUrl ? `${baseUrl}/blog/${article.slug}` : undefined;
  return {
    title: article.title,
    description: article.summary,
    alternates: canonical ? { canonical } : undefined,
    openGraph: {
      type: "article",
      title: article.title,
      description: article.summary,
      url: canonical,
      images: article.coverImageUrl
        ? [{ url: article.coverImageUrl }]
        : undefined,
      publishedTime: article.publishedAt ?? undefined,
      modifiedTime: article.updatedAt,
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.summary,
      images: article.coverImageUrl ? [article.coverImageUrl] : undefined,
    },
  };
}

export default async function ArticlePage({ params }: RouteParams) {
  const { slug } = await params;
  const article = await getBySlug(slug).catch(() => null);
  if (!article) {
    notFound();
  }

  const t = blogT();

  return (
    <article className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
      <Link
        href="/blog"
        className="inline-block mb-8 text-sm text-[var(--muted)] hover:text-[var(--accent)] transition-colors"
      >
        ← {t.detail.backToList}
      </Link>

      <header className="max-w-2xl mx-auto">
        <h1 className="font-headline text-4xl md:text-5xl text-[var(--fg)] leading-tight mb-6">
          {article.title}
        </h1>
        <p className="text-lg text-[var(--muted-hi)] leading-relaxed mb-6">
          {article.summary}
        </p>
        <ArticleMeta
          publishedAt={article.publishedAt}
          readingTimeMinutes={article.readingTimeMinutes}
          tags={article.tags}
          showTags
          className="mb-10"
        />
      </header>

      {article.coverImageUrl ? (
        <div className="max-w-4xl mx-auto mb-12">
          <Image
            src={article.coverImageUrl}
            alt={article.title}
            width={1600}
            height={900}
            priority
            className="w-full h-auto rounded-lg border border-[var(--border)] object-cover aspect-[16/9]"
            sizes="(max-width: 1024px) 100vw, 1024px"
          />
        </div>
      ) : null}

      <ArticleContent markdown={article.contentMd} />

      {article.tags.length > 0 ? (
        <footer className="max-w-2xl mx-auto mt-16 pt-8 border-t border-[var(--border)]">
          <h2 className="text-xs uppercase tracking-wider text-[var(--muted)] mb-3">
            {t.detail.tags}
          </h2>
          <ul className="flex flex-wrap gap-2">
            {article.tags.map((tag) => (
              <li
                key={tag}
                className="text-sm border border-[var(--border)] rounded px-3 py-1 text-[var(--muted-hi)]"
              >
                #{tag}
              </li>
            ))}
          </ul>
        </footer>
      ) : null}
    </article>
  );
}
