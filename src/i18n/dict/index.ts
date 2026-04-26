import es from "./dict.es.json";
import en from "./dict.en.json";
import ca from "./dict.ca.json";

export type Locale = "es" | "en" | "ca";

export type MessageDict = typeof es;

export const dictionaries: Record<Locale, MessageDict> = { es, en, ca };

export const defaultLocale: Locale = "es";

const STORAGE_KEY = "kroomix-locale";

export function readStoredLocale(): Locale {
  if (typeof window === "undefined") return defaultLocale;
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === "es" || v === "en" || v === "ca") return v;
  } catch {
    /* empty */
  }
  return defaultLocale;
}

export function storeLocale(l: Locale) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, l);
  } catch {
    /* empty */
  }
}
