import { supabase } from "@/lib/supabase";
import { Article, ArticleListItem, ArticleRow } from "@/types/blog";
import { rowToArticle } from "./articleService";

export interface ListPublishedOptions {
  limit?: number;
  offset?: number;
}

const LIST_COLUMNS =
  "id, slug, title, summary, cover_image_url, tags, reading_time_minutes, published_at";

function rowToListItem(row: {
  id: string;
  slug: string;
  title: string;
  summary: string;
  cover_image_url: string | null;
  tags: string[] | null;
  reading_time_minutes: number;
  published_at: string;
}): ArticleListItem {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    coverImageUrl: row.cover_image_url,
    tags: row.tags ?? [],
    readingTimeMinutes: row.reading_time_minutes,
    publishedAt: row.published_at,
  };
}

export async function listPublished(
  options: ListPublishedOptions = {},
): Promise<ArticleListItem[]> {
  const limit = options.limit ?? 10;
  const offset = options.offset ?? 0;

  const { data, error } = await supabase
    .from("articles")
    .select(LIST_COLUMNS)
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    throw new Error(`listPublished: ${error.message}`);
  }
  return (data ?? []).map(rowToListItem as never);
}

export async function countPublished(): Promise<number> {
  const { count, error } = await supabase
    .from("articles")
    .select("id", { count: "exact", head: true })
    .eq("status", "published");
  if (error) {
    throw new Error(`countPublished: ${error.message}`);
  }
  return count ?? 0;
}

export async function getBySlug(slug: string): Promise<Article | null> {
  const { data, error } = await supabase
    .from("articles")
    .select()
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (error) {
    throw new Error(`getBySlug: ${error.message}`);
  }
  if (!data) return null;
  return rowToArticle(data as ArticleRow);
}

export async function getBySlugAnyStatus(
  slug: string,
): Promise<Article | null> {
  const { data, error } = await supabase
    .from("articles")
    .select()
    .eq("slug", slug)
    .maybeSingle();
  if (error) {
    throw new Error(`getBySlugAnyStatus: ${error.message}`);
  }
  if (!data) return null;
  return rowToArticle(data as ArticleRow);
}

export async function listByTag(
  tag: string,
  options: ListPublishedOptions = {},
): Promise<ArticleListItem[]> {
  const limit = options.limit ?? 20;
  const offset = options.offset ?? 0;

  const { data, error } = await supabase
    .from("articles")
    .select(LIST_COLUMNS)
    .eq("status", "published")
    .contains("tags", [tag])
    .order("published_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    throw new Error(`listByTag: ${error.message}`);
  }
  return (data ?? []).map(rowToListItem as never);
}

export async function listAllPublishedSlugs(): Promise<
  Array<{ slug: string; updatedAt: string }>
> {
  const { data, error } = await supabase
    .from("articles")
    .select("slug, updated_at")
    .eq("status", "published");
  if (error) {
    throw new Error(`listAllPublishedSlugs: ${error.message}`);
  }
  return (data ?? []).map((row) => ({
    slug: (row as { slug: string }).slug,
    updatedAt: (row as { updated_at: string }).updated_at,
  }));
}

export async function listAllPublishedTags(): Promise<string[]> {
  const { data, error } = await supabase
    .from("articles")
    .select("tags")
    .eq("status", "published");
  if (error) {
    throw new Error(`listAllPublishedTags: ${error.message}`);
  }
  const set = new Set<string>();
  for (const row of data ?? []) {
    const tags = (row as { tags: string[] | null }).tags ?? [];
    for (const tag of tags) {
      if (tag) set.add(tag);
    }
  }
  return Array.from(set).sort();
}
