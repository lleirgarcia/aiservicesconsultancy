import { readOptional } from "@/lib/env";

/**
 * URL pública canónica del sitio. Usa BLOG_PUBLIC_SITE_URL si está definida
 * (permite apuntar a previews) y cae al dominio de producción si no.
 */
export const SITE_URL = (
  readOptional("BLOG_PUBLIC_SITE_URL") ?? "https://www.kroomix.com"
).replace(/\/+$/, "");
