import fs from "node:fs";
import path from "node:path";
import type { Locale } from "@/i18n/dict";

const valid = new Set<Locale>(["es", "en", "ca"]);
const cache: Partial<Record<Locale, string>> = {};

function read(locale: Locale): string {
  if (cache[locale]) return cache[locale]!;
  const p = path.join(process.cwd(), "src", "i18n", `chatSystem.${locale}.txt`);
  const text = fs.readFileSync(p, "utf8");
  cache[locale] = text;
  return text;
}

export function getChatSystemInstruction(raw: string | undefined): string {
  const l = valid.has(raw as Locale) ? (raw as Locale) : "es";
  return read(l);
}
