import Link from "next/link";
import { ArticleListItem } from "@/types/blog";
import { ArticleCard } from "./ArticleCard";
import { blogT } from "@/i18n/blogServer";

interface ArticleListProps {
  items: ArticleListItem[];
  page: number;
  totalPages: number;
  baseHref?: string;
}

export function ArticleList({
  items,
  page,
  totalPages,
  baseHref = "/blog",
}: ArticleListProps) {
  const t = blogT();
  const hasMore = page < totalPages;
  const hasPrev = page > 1;

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item) => (
          <ArticleCard key={item.id} article={item} />
        ))}
      </div>

      {(hasMore || hasPrev) && totalPages > 1 ? (
        <nav className="flex justify-between items-center mt-12 text-sm">
          {hasPrev ? (
            <Link
              href={
                page - 1 === 1
                  ? baseHref
                  : `${baseHref}?page=${page - 1}`
              }
              className="text-[var(--muted)] hover:text-[var(--accent)] transition-colors"
            >
              ← Página anterior
            </Link>
          ) : (
            <span />
          )}
          <span className="text-xs text-[var(--muted)] uppercase tracking-wider">
            Página {page} / {totalPages}
          </span>
          {hasMore ? (
            <Link
              href={`${baseHref}?page=${page + 1}`}
              className="text-[var(--accent)] hover:underline"
            >
              {t.list.loadMore} →
            </Link>
          ) : (
            <span />
          )}
        </nav>
      ) : null}
    </div>
  );
}
