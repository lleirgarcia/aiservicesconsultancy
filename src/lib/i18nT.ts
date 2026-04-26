import type { Locale, MessageDict } from "@/i18n/dict";

type Vars = Record<string, string | number | undefined>;

function getNested(obj: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, k) => {
    if (acc == null || typeof acc !== "object") return undefined;
    return (acc as Record<string, unknown>)[k];
  }, obj);
}

/**
 * @param key dot path e.g. "sectionCta.title"
 * @param vars string interpolation {key}
 */
export function makeT(dict: MessageDict) {
  return function t(key: string, vars?: Vars): string {
    const v = getNested(dict as unknown as Record<string, unknown>, key);
    if (v != null && typeof v !== "string") {
      return key;
    }
    let s = (typeof v === "string" ? v : key).replace(/\\n/g, "\n");
    if (vars) {
      for (const [k, val] of Object.entries(vars)) {
        if (val === undefined) continue;
        s = s.split(`{${k}}`).join(String(val));
      }
    }
    return s;
  };
}

export const langHtml: Record<Locale, string> = {
  es: "es",
  en: "en",
  ca: "ca",
};

export const speechLang: Record<Locale, string> = {
  es: "es-ES",
  en: "en-GB",
  ca: "ca-ES",
};
