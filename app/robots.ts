import type { MetadataRoute } from "next";
import { getBaseUrl } from "@/lib/seo";

const DISALLOW = [
  "/api/",
  "/dashboard",
  "/settings",
  "/_next/",
  "/sign-in",
  "/sign-up",
  "/admin",
  "/compare",
  "/results",
  "/history",
];

export default function robots(): MetadataRoute.Robots {
  const base = getBaseUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: DISALLOW,
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: DISALLOW,
      },
      {
        userAgent: "Bingbot",
        allow: "/",
        disallow: DISALLOW,
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
