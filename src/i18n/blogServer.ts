import { dictionaries, defaultLocale } from "./dict";

export type BlogDict = typeof dictionaries.es.blog;

export function blogT(): BlogDict {
  return dictionaries[defaultLocale].blog;
}

export function formatBlogDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("es-ES", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function interpolate(
  template: string,
  values: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => {
    const v = values[key];
    return v === undefined ? `{${key}}` : String(v);
  });
}
