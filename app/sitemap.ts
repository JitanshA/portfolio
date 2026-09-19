import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  // Empty until a production domain exists: sitemap entries must be absolute
  // URLs, and this deployment does not yet have a public origin to publish.
  return [];
}
