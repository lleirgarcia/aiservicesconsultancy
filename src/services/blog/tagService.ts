import { supabase } from "@/lib/supabase";
import { generateSlug } from "@/lib/blog/slug";

export function normalizeTags(tags: string[] | undefined | null): string[] {
  if (!tags || tags.length === 0) return [];
  const normalized = tags
    .map((t) => generateSlug(String(t)))
    .filter((t) => t.length > 0);
  return Array.from(new Set(normalized));
}

export interface MergeTagSuggestionsOptions {
  includeDrafts?: boolean;
}

export async function mergeTagSuggestions(
  options: MergeTagSuggestionsOptions = {},
): Promise<string[]> {
  const { includeDrafts = false } = options;
  let query = supabase.from("articles").select("tags");
  if (!includeDrafts) {
    query = query.eq("status", "published");
  }
  const { data, error } = await query;
  if (error) {
    throw new Error(`mergeTagSuggestions: ${error.message}`);
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
