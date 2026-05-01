export type ArticleStatus = "draft" | "published";

export interface Article {
  id: string;
  slug: string;
  title: string;
  summary: string;
  contentMd: string;
  coverImageUrl: string | null;
  status: ArticleStatus;
  tags: string[];
  readingTimeMinutes: number;
  authorDisplayName: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
}

export interface ArticleRow {
  id: string;
  slug: string;
  title: string;
  summary: string;
  content_md: string;
  cover_image_url: string | null;
  status: ArticleStatus;
  tags: string[];
  reading_time_minutes: number;
  author_display_name: string;
  created_at: string;
  updated_at: string;
  published_at: string | null;
}

export interface ArticleListItem {
  id: string;
  slug: string;
  title: string;
  summary: string;
  coverImageUrl: string | null;
  tags: string[];
  readingTimeMinutes: number;
  publishedAt: string;
}

export interface CreateArticleInput {
  title: string;
  summary: string;
  contentMd: string;
  coverImageUrl?: string | null;
  tags?: string[];
  status?: ArticleStatus;
  slug?: string;
}

export type UpdateArticleInput = Partial<
  Omit<CreateArticleInput, "slug">
> & {
  slug?: string;
};

export type ArticleServiceError =
  | { code: "validation_failed"; fields: Record<string, string> }
  | { code: "slug_taken"; suggestedSlug: string }
  | { code: "slug_locked" }
  | { code: "not_found" }
  | { code: "cannot_delete_published" };
