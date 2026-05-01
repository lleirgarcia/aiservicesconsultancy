import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/blog/requireAdmin";
import {
  ArticleServiceError,
  createArticle,
  listArticlesAdmin,
} from "@/services/blog/articleService";
import { ArticleStatus } from "@/types/blog";

export async function GET(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const url = new URL(req.url);
  const status = url.searchParams.get("status") as ArticleStatus | null;
  const q = url.searchParams.get("q") ?? undefined;

  try {
    const items = await listArticlesAdmin({
      status: status === "draft" || status === "published" ? status : undefined,
      q,
    });
    return NextResponse.json({ items });
  } catch (err) {
    return NextResponse.json(
      { error: "internal_error", message: (err as Error).message },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard) return guard;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "validation_failed", fields: { body: "invalid_json" } },
      { status: 400 },
    );
  }

  try {
    const article = await createArticle({
      title: String(body.title ?? ""),
      summary: String(body.summary ?? ""),
      contentMd: String(body.contentMd ?? ""),
      coverImageUrl:
        typeof body.coverImageUrl === "string" || body.coverImageUrl === null
          ? (body.coverImageUrl as string | null)
          : null,
      tags: Array.isArray(body.tags) ? (body.tags as string[]) : [],
      status:
        body.status === "published" || body.status === "draft"
          ? body.status
          : "draft",
      slug: typeof body.slug === "string" ? body.slug : undefined,
    });

    if (article.status === "published") {
      revalidatePath("/blog");
      revalidatePath(`/blog/${article.slug}`);
      for (const tag of article.tags) {
        revalidatePath(`/blog/tag/${tag}`);
      }
    }

    return NextResponse.json({ article }, { status: 201 });
  } catch (err) {
    if (err instanceof ArticleServiceError) {
      return errorResponse(err);
    }
    return NextResponse.json(
      { error: "internal_error", message: (err as Error).message },
      { status: 500 },
    );
  }
}

function errorResponse(err: ArticleServiceError): NextResponse {
  const status =
    err.code === "validation_failed"
      ? 400
      : err.code === "slug_taken" || err.code === "slug_locked"
        ? 409
        : err.code === "not_found"
          ? 404
          : err.code === "cannot_delete_published"
            ? 409
            : 500;
  return NextResponse.json(
    { error: err.code, ...(err.extra ?? {}) },
    { status },
  );
}
