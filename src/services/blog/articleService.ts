import { supabase } from "@/lib/supabase";
import {
  Article,
  ArticleRow,
  ArticleStatus,
  CreateArticleInput,
  UpdateArticleInput,
} from "@/types/blog";
import { ensureUniqueSlug, generateSlug } from "@/lib/blog/slug";
import { calculateReadingTime } from "@/lib/blog/readingTime";
import { normalizeTags } from "./tagService";

export class ArticleServiceError extends Error {
  constructor(
    public readonly code:
      | "validation_failed"
      | "slug_taken"
      | "slug_locked"
      | "not_found"
      | "cannot_delete_published"
      | "internal_error",
    message: string,
    public readonly extra?: Record<string, unknown>,
  ) {
    super(message);
  }
}

export function rowToArticle(row: ArticleRow): Article {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    contentMd: row.content_md,
    coverImageUrl: row.cover_image_url,
    status: row.status,
    tags: row.tags ?? [],
    readingTimeMinutes: row.reading_time_minutes,
    authorDisplayName: row.author_display_name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    publishedAt: row.published_at,
  };
}

interface ArticleRowInsert {
  slug: string;
  title: string;
  summary: string;
  content_md: string;
  cover_image_url: string | null;
  status: ArticleStatus;
  tags: string[];
  reading_time_minutes: number;
  author_display_name?: string;
}

interface ArticleRowUpdate {
  slug?: string;
  title?: string;
  summary?: string;
  content_md?: string;
  cover_image_url?: string | null;
  status?: ArticleStatus;
  tags?: string[];
  reading_time_minutes?: number;
}

function validatePublishable(input: {
  title?: string | null;
  summary?: string | null;
  contentMd?: string | null;
  coverImageUrl?: string | null;
}): Record<string, string> {
  const fields: Record<string, string> = {};
  if (!input.title || !input.title.trim()) fields.title = "required";
  if (!input.summary || !input.summary.trim()) fields.summary = "required";
  if (!input.contentMd || !input.contentMd.trim())
    fields.contentMd = "required";
  if (!input.coverImageUrl) fields.coverImageUrl = "required";
  return fields;
}

export async function createArticle(
  input: CreateArticleInput,
): Promise<Article> {
  const status: ArticleStatus = input.status ?? "draft";

  if (!input.title || !input.title.trim()) {
    throw new ArticleServiceError("validation_failed", "title required", {
      fields: { title: "required" },
    });
  }
  if (!input.summary || !input.summary.trim()) {
    throw new ArticleServiceError("validation_failed", "summary required", {
      fields: { summary: "required" },
    });
  }
  if (!input.contentMd) {
    throw new ArticleServiceError("validation_failed", "contentMd required", {
      fields: { contentMd: "required" },
    });
  }

  if (status === "published") {
    const fields = validatePublishable({
      title: input.title,
      summary: input.summary,
      contentMd: input.contentMd,
      coverImageUrl: input.coverImageUrl ?? null,
    });
    if (Object.keys(fields).length > 0) {
      throw new ArticleServiceError(
        "validation_failed",
        "publish requirements",
        { fields },
      );
    }
  }

  const baseSlug = input.slug
    ? generateSlug(input.slug)
    : generateSlug(input.title);
  if (!baseSlug) {
    throw new ArticleServiceError("validation_failed", "slug invalid", {
      fields: { slug: "invalid" },
    });
  }

  const explicitSlug = !!input.slug;
  let finalSlug: string;
  if (explicitSlug) {
    const { data: existing } = await supabase
      .from("articles")
      .select("id")
      .eq("slug", baseSlug)
      .limit(1);
    if (existing && existing.length > 0) {
      const suggested = await ensureUniqueSlug(supabase, baseSlug);
      throw new ArticleServiceError("slug_taken", "slug taken", {
        suggestedSlug: suggested,
      });
    }
    finalSlug = baseSlug;
  } else {
    finalSlug = await ensureUniqueSlug(supabase, baseSlug);
  }

  const tags = normalizeTags(input.tags);
  const readingTime = calculateReadingTime(input.contentMd);

  const insert: ArticleRowInsert = {
    slug: finalSlug,
    title: input.title.trim(),
    summary: input.summary.trim(),
    content_md: input.contentMd,
    cover_image_url: input.coverImageUrl ?? null,
    status,
    tags,
    reading_time_minutes: readingTime,
  };

  const { data, error } = await supabase
    .from("articles")
    .insert(insert)
    .select()
    .single();

  if (error || !data) {
    throw new ArticleServiceError(
      "internal_error",
      error?.message ?? "insert failed",
    );
  }

  let row = data as ArticleRow;

  if (status === "published" && !row.published_at) {
    const { data: published } = await supabase
      .from("articles")
      .update({ status: "published" })
      .eq("id", row.id)
      .select()
      .single();
    if (published) row = published as ArticleRow;
  }

  return rowToArticle(row);
}

export async function getArticleById(id: string): Promise<Article | null> {
  const { data, error } = await supabase
    .from("articles")
    .select()
    .eq("id", id)
    .maybeSingle();
  if (error) {
    throw new ArticleServiceError("internal_error", error.message);
  }
  if (!data) return null;
  return rowToArticle(data as ArticleRow);
}

export interface ListAdminFilters {
  status?: ArticleStatus;
  q?: string;
}

export async function listArticlesAdmin(
  filters: ListAdminFilters = {},
): Promise<Article[]> {
  let query = supabase
    .from("articles")
    .select()
    .order("updated_at", { ascending: false });
  if (filters.status) {
    query = query.eq("status", filters.status);
  }
  if (filters.q && filters.q.trim()) {
    const term = `%${filters.q.trim()}%`;
    query = query.or(`title.ilike.${term},summary.ilike.${term}`);
  }
  const { data, error } = await query;
  if (error) {
    throw new ArticleServiceError("internal_error", error.message);
  }
  return (data ?? []).map((row) => rowToArticle(row as ArticleRow));
}

export async function updateArticle(
  id: string,
  input: UpdateArticleInput,
): Promise<Article> {
  const existing = await getArticleById(id);
  if (!existing) {
    throw new ArticleServiceError("not_found", "article not found");
  }

  const update: ArticleRowUpdate = {};

  if (input.slug !== undefined) {
    const desiredSlug = generateSlug(input.slug);
    if (!desiredSlug) {
      throw new ArticleServiceError("validation_failed", "slug invalid", {
        fields: { slug: "invalid" },
      });
    }
    if (desiredSlug !== existing.slug) {
      if (existing.publishedAt !== null) {
        throw new ArticleServiceError("slug_locked", "slug locked");
      }
      const { data: collision } = await supabase
        .from("articles")
        .select("id")
        .eq("slug", desiredSlug)
        .neq("id", id)
        .limit(1);
      if (collision && collision.length > 0) {
        const suggested = await ensureUniqueSlug(supabase, desiredSlug, id);
        throw new ArticleServiceError("slug_taken", "slug taken", {
          suggestedSlug: suggested,
        });
      }
      update.slug = desiredSlug;
    }
  }

  if (input.title !== undefined) update.title = input.title.trim();
  if (input.summary !== undefined) update.summary = input.summary.trim();
  if (input.contentMd !== undefined) {
    update.content_md = input.contentMd;
    update.reading_time_minutes = calculateReadingTime(input.contentMd);
  }
  if (input.coverImageUrl !== undefined)
    update.cover_image_url = input.coverImageUrl;
  if (input.tags !== undefined) update.tags = normalizeTags(input.tags);

  if (input.status !== undefined) {
    update.status = input.status;
    if (input.status === "published") {
      const merged = {
        title: input.title ?? existing.title,
        summary: input.summary ?? existing.summary,
        contentMd: input.contentMd ?? existing.contentMd,
        coverImageUrl:
          input.coverImageUrl !== undefined
            ? input.coverImageUrl
            : existing.coverImageUrl,
      };
      const fields = validatePublishable(merged);
      if (Object.keys(fields).length > 0) {
        throw new ArticleServiceError(
          "validation_failed",
          "publish requirements",
          { fields },
        );
      }
    }
  }

  if (Object.keys(update).length === 0) {
    return existing;
  }

  const { data, error } = await supabase
    .from("articles")
    .update(update)
    .eq("id", id)
    .select()
    .single();

  if (error || !data) {
    throw new ArticleServiceError(
      "internal_error",
      error?.message ?? "update failed",
    );
  }
  return rowToArticle(data as ArticleRow);
}

export async function deleteArticle(id: string): Promise<void> {
  const existing = await getArticleById(id);
  if (!existing) {
    throw new ArticleServiceError("not_found", "article not found");
  }
  if (existing.status === "published" || existing.publishedAt !== null) {
    throw new ArticleServiceError(
      "cannot_delete_published",
      "cannot delete published",
    );
  }
  const { error } = await supabase.from("articles").delete().eq("id", id);
  if (error) {
    throw new ArticleServiceError("internal_error", error.message);
  }
}
