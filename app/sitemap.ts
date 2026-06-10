import type { MetadataRoute } from "next";
import { getBaseUrl } from "@/lib/seo";
import { getAllBlogEntries } from "@/lib/blog";
import { ROLE_SLUGS } from "@/lib/roles";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getBaseUrl();
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: base, lastModified: now, changeFrequency: "weekly", priority: 1.0 },
    {
      url: `${base}/how-it-works`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${base}/faq`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${base}/pricing`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${base}/blog`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    },
  ];

  const blogPages: MetadataRoute.Sitemap = getAllBlogEntries().map((entry) => ({
    url: `${base}/blog/${entry.slug}`,
    lastModified: entry.lastModified,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  const rolePages: MetadataRoute.Sitemap = ROLE_SLUGS.map((role) => ({
    url: `${base}/resume-optimizer/${role}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [...staticPages, ...blogPages, ...rolePages];
}
