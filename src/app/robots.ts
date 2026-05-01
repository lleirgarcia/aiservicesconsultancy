import type { MetadataRoute } from "next";
import { readOptional } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = (readOptional("BLOG_PUBLIC_SITE_URL") ?? "").replace(
    /\/+$/,
    "",
  );
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/blog/admin/", "/api/", "/demos/"],
    },
    sitemap: baseUrl ? `${baseUrl}/sitemap.xml` : undefined,
  };
}
