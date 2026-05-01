import { blogT, formatBlogDate, interpolate } from "@/i18n/blogServer";

interface ArticleMetaProps {
  publishedAt: string | null;
  readingTimeMinutes: number;
  tags?: string[];
  showTags?: boolean;
  className?: string;
}

export function ArticleMeta({
  publishedAt,
  readingTimeMinutes,
  tags = [],
  showTags = false,
  className = "",
}: ArticleMetaProps) {
  const t = blogT();
  return (
    <div
      className={`flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-[var(--muted)] ${className}`}
    >
      {publishedAt ? (
        <time dateTime={publishedAt} className="whitespace-nowrap">
          {interpolate(t.detail.publishedOn, {
            date: formatBlogDate(publishedAt),
          })}
        </time>
      ) : null}
      <span aria-hidden="true">·</span>
      <span className="whitespace-nowrap">
        {interpolate(t.detail.readingTime, { minutes: readingTimeMinutes })}
      </span>
      {showTags && tags.length > 0 ? (
        <>
          <span aria-hidden="true">·</span>
          <ul className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <li
                key={tag}
                className="text-xs uppercase tracking-wide text-[var(--muted-hi)]"
              >
                #{tag}
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </div>
  );
}
