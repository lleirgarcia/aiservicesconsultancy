import Link from "next/link";
import { listArticlesAdmin } from "@/services/blog/articleService";
import { blogT, formatBlogDate } from "@/i18n/blogServer";
import { DeleteDraftButton } from "@/components/blog/admin/DeleteDraftButton";

export const dynamic = "force-dynamic";

export default async function AdminListPage() {
  const t = blogT();
  let articles: Awaited<ReturnType<typeof listArticlesAdmin>> = [];
  let loadError: string | null = null;
  try {
    articles = await listArticlesAdmin();
  } catch (e) {
    loadError = (e as Error).message;
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-headline text-2xl sm:text-3xl text-[var(--fg)]">
          {t.admin.list.title}
        </h1>
        <Link
          href="/blog/admin/editor/new"
          className="px-4 py-2 border border-[var(--accent)] text-[var(--fg)] rounded hover:bg-[var(--accent-dim)] transition-colors font-headline uppercase tracking-wide text-xs sm:text-sm"
        >
          {t.admin.list.newArticle}
        </Link>
      </div>

      {loadError ? (
        <p className="text-sm text-red-400">Error: {loadError}</p>
      ) : articles.length === 0 ? (
        <p className="text-[var(--muted)]">{t.admin.list.empty}</p>
      ) : (
        <div className="overflow-x-auto border border-[var(--border)] rounded">
          <table className="w-full text-sm">
            <thead className="bg-[var(--bg-soft)] text-[var(--muted-hi)]">
              <tr>
                <th className="text-left px-4 py-3 font-semibold uppercase tracking-wide text-xs">
                  {t.admin.list.columns.title}
                </th>
                <th className="text-left px-4 py-3 font-semibold uppercase tracking-wide text-xs">
                  {t.admin.list.columns.status}
                </th>
                <th className="text-left px-4 py-3 font-semibold uppercase tracking-wide text-xs">
                  {t.admin.list.columns.updatedAt}
                </th>
                <th className="text-right px-4 py-3 font-semibold uppercase tracking-wide text-xs">
                  {t.admin.list.columns.actions}
                </th>
              </tr>
            </thead>
            <tbody>
              {articles.map((article) => (
                <tr
                  key={article.id}
                  className="border-t border-[var(--border)]"
                >
                  <td className="px-4 py-3 text-[var(--fg)]">
                    <div className="font-medium">{article.title}</div>
                    <div className="text-xs text-[var(--muted)] mt-1">
                      /{article.slug}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {article.status === "published" ? (
                      <span className="inline-block px-2 py-1 text-xs rounded bg-[var(--accent-dim)] text-[var(--accent)] uppercase tracking-wide">
                        {t.admin.list.statusPublished}
                      </span>
                    ) : (
                      <span className="inline-block px-2 py-1 text-xs rounded border border-[var(--border)] text-[var(--muted)] uppercase tracking-wide">
                        {t.admin.list.statusDraft}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[var(--muted)]">
                    {formatBlogDate(article.updatedAt)}
                  </td>
                  <td className="px-4 py-3 text-right space-x-3">
                    <Link
                      href={`/blog/admin/editor/${article.id}`}
                      className="text-[var(--accent)] hover:underline text-sm"
                    >
                      Editar
                    </Link>
                    {article.status === "draft" ? (
                      <DeleteDraftButton id={article.id} />
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
