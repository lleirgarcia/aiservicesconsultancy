import Image from "next/image";
import Link from "next/link";
import { ArticleListItem } from "@/types/blog";
import { ArticleMeta } from "./ArticleMeta";

interface ArticleCardProps {
  article: ArticleListItem;
}

export function ArticleCard({ article }: ArticleCardProps) {
  return (
    <article className="group flex flex-col h-full border border-[var(--border)] rounded-lg overflow-hidden bg-[var(--bg-soft)]/40 hover:border-[var(--accent)] transition-colors">
      <Link
        href={`/blog/${article.slug}`}
        className="block aspect-[16/9] relative overflow-hidden bg-[var(--bg-elevated)]"
      >
        {article.coverImageUrl ? (
          <Image
            src={article.coverImageUrl}
            alt={article.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[var(--muted)] text-sm">
            Sin portada
          </div>
        )}
      </Link>
      <div className="flex flex-col gap-3 p-5 flex-1">
        <Link href={`/blog/${article.slug}`}>
          <h2 className="font-headline text-xl text-[var(--fg)] leading-snug group-hover:text-[var(--accent)] transition-colors">
            {article.title}
          </h2>
        </Link>
        <p className="text-sm text-[var(--muted-hi)] leading-relaxed line-clamp-3 flex-1">
          {article.summary}
        </p>
        <ArticleMeta
          publishedAt={article.publishedAt}
          readingTimeMinutes={article.readingTimeMinutes}
          tags={article.tags}
          className="mt-2"
        />
      </div>
    </article>
  );
}
