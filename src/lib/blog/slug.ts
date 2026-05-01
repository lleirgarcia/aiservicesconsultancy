import type { SupabaseClient } from "@supabase/supabase-js";

const COMBINING_DIACRITICS = /[̀-ͯ]/g;

export function generateSlug(input: string): string {
  if (!input) return "";
  return input
    .normalize("NFD")
    .replace(COMBINING_DIACRITICS, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function ensureUniqueSlug(
  supabase: SupabaseClient,
  baseSlug: string,
  ignoreId?: string,
): Promise<string> {
  if (!baseSlug) {
    throw new Error("ensureUniqueSlug: baseSlug vacío");
  }

  let candidate = baseSlug;
  let counter = 2;

  while (true) {
    let query = supabase
      .from("articles")
      .select("id")
      .eq("slug", candidate)
      .limit(1);
    if (ignoreId) {
      query = query.neq("id", ignoreId);
    }
    const { data, error } = await query;
    if (error) {
      throw new Error(`ensureUniqueSlug: ${error.message}`);
    }
    if (!data || data.length === 0) {
      return candidate;
    }
    candidate = `${baseSlug}-${counter}`;
    counter += 1;
    if (counter > 1000) {
      throw new Error("ensureUniqueSlug: demasiadas colisiones");
    }
  }
}
