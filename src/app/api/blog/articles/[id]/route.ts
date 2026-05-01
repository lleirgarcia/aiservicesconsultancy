import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/blog/requireAdmin";
import {
  ArticleServiceError,
  deleteArticle,
  getArticleById,
  updateArticle,
} from "@/services/blog/articleService";
import { deleteArticleImages } from "@/services/blog/storageService";
import { ArticleStatus } from "@/types/blog";

interface Ctx {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, { params }: Ctx) {
  const guard = await requireAdmin();
  if (guard) return guard;
  const { id } = await params;
  try {
    const article = await getArticleById(id);
    if (!article) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    return NextResponse.json({ article });
  } catch (err) {
    return NextResponse.json(
      { error: "internal_error", message: (err as Error).message },
      { status: 500 },
    );
  }
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const guard = await requireAdmin();
  if (guard) return guard;
  const { id } = await params;

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
    const before = await getArticleById(id);
    if (!before) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const article = await updateArticle(id, {
      title: typeof body.title === "string" ? body.title : undefined,
      summary: typeof body.summary === "string" ? body.summary : undefined,
      contentMd:
        typeof body.contentMd === "string" ? body.contentMd : undefined,
      coverImageUrl:
        typeof body.coverImageUrl === "string" || body.coverImageUrl === null
          ? (body.coverImageUrl as string | null)
          : undefined,
      tags: Array.isArray(body.tags) ? (body.tags as string[]) : undefined,
      status:
        body.status === "draft" || body.status === "published"
          ? (body.status as ArticleStatus)
          : undefined,
      slug: typeof body.slug === "string" ? body.slug : undefined,
    });

    revalidatePath("/blog");
    revalidatePath(`/blog/${before.slug}`);
    if (article.slug !== before.slug) {
      revalidatePath(`/blog/${article.slug}`);
    }
    const tagSet = new Set([...before.tags, ...article.tags]);
    for (const tag of tagSet) {
      revalidatePath(`/blog/tag/${tag}`);
    }

    return NextResponse.json({ article });
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

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const guard = await requireAdmin();
  if (guard) return guard;
  const { id } = await params;

  try {
    const article = await getArticleById(id);
    if (!article) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    if (article.status === "published" || article.publishedAt !== null) {
      return NextResponse.json(
        { error: "cannot_delete_published", hint: "unpublish_first" },
        { status: 409 },
      );
    }
    await deleteArticle(id);
    try {
      await deleteArticleImages(id);
    } catch {
      // best effort: continuamos aunque la limpieza falle
    }
    revalidatePath("/blog");
    return NextResponse.json({ ok: true });
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
