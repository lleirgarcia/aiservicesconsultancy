import type { MetadataRoute } from "next";
import { listAllPublishedSlugs } from "@/services/blog/articleQueries";
import { readOptional } from "@/lib/env";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = (readOptional("BLOG_PUBLIC_SITE_URL") ?? "").replace(
    /\/+$/,
    "",
  );
  if (!baseUrl) return [];

  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    },
  ];

  let articleEntries: MetadataRoute.Sitemap = [];
  try {
    const slugs = await listAllPublishedSlugs();
    articleEntries = slugs.map(({ slug, updatedAt }) => ({
      url: `${baseUrl}/blog/${slug}`,
      lastModified: new Date(updatedAt),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }));
  } catch {
    // si la BD no responde, sitemap sigue con las rutas estáticas
  }

  return [...staticEntries, ...articleEntries];
}
