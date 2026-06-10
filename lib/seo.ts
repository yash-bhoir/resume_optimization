import type { Metadata } from "next";

export const SITE_NAME = "Resume Fit";
export const SITE_TAGLINE = "ATS Resume Optimizer";
export const BRAND_COLOR = "#2A6B4F";

export const DEFAULT_TITLE =
  "Free Resume Optimizer & ATS Checker — Land More Interviews";

export const DEFAULT_DESCRIPTION =
  "Free resume optimizer and ATS checker. Upload your resume, paste a job description, and tailor your resume to pass ATS screening in 30 seconds.";

export const HOMEPAGE_TITLE = DEFAULT_TITLE;

export const HOMEPAGE_DESCRIPTION =
  "Optimize resume for job description free. Our ATS resume checker scores keyword match, fixes formatting, and helps you pass ATS screening — try free online.";

export type PageType =
  | "home"
  | "how-it-works"
  | "faq"
  | "pricing"
  | "blog-index"
  | "blog-post"
  | "role"
  | "default";

export interface PageSEOConfig {
  title: string;
  description: string;
  path: string;
  pageType?: PageType;
  exactTitle?: boolean;
  ogImage?: string;
  noIndex?: boolean;
  keywords?: string[];
}

export const PAGE_TITLES = {
  home: HOMEPAGE_TITLE,
  "how-it-works": "How Our ATS Resume Optimizer Works | Resume Fit",
  faq: "Resume ATS FAQ — Everything You Need to Know",
  pricing: "Pricing — Free ATS Resume Checker & Pro Plan",
  "blog-index": "Resume Tips & ATS Guides | Blog",
} as const;

export function getBaseUrl(): string {
  const url =
    process.env.NEXT_PUBLIC_APP_URL?.trim() || "https://resumefit.up.railway.app";
  return url.replace(/\/$/, "");
}

export function absoluteUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${getBaseUrl()}${normalized}`;
}

export function buildOgImageUrl(
  title: string,
  description?: string,
  type?: string
): string {
  const params = new URLSearchParams({ title });
  if (description) params.set("description", description.slice(0, 120));
  if (type) params.set("type", type);
  return `${absoluteUrl("/api/og")}?${params.toString()}`;
}

export function blogPostTitle(postTitle: string): string {
  return `${postTitle} | Resume Fit Blog`;
}

export function rolePageTitle(roleTitle: string): string {
  return `Resume Optimizer for ${roleTitle} — ATS Keywords & Tips`;
}

export function rolePageDescription(roleTitle: string): string {
  return `Free resume optimizer for ${roleTitle.toLowerCase()} roles. Check ATS compatibility, match job description keywords, and improve your ATS score before you apply.`;
}

/** Build Next.js Metadata from a page SEO config. */
export function generateMetadata(config: PageSEOConfig): Metadata {
  const {
    title,
    description,
    path,
    exactTitle,
    ogImage,
    noIndex,
    keywords,
    pageType,
  } = config;

  const canonical = absoluteUrl(path);
  const fullTitle =
    exactTitle || pageType === "home"
      ? title
      : pageType === "blog-post"
        ? blogPostTitle(title)
        : pageType === "role"
          ? rolePageTitle(title)
          : `${title} | ${SITE_NAME}`;

  const image = ogImage ?? buildOgImageUrl(title, description, pageType);

  return {
    title: fullTitle,
    description,
    keywords,
    alternates: { canonical },
    robots: noIndex
      ? { index: false, follow: false }
      : {
          index: true,
          follow: true,
          googleBot: { index: true, follow: true },
        },
    openGraph: {
      type: pageType === "blog-post" ? "article" : "website",
      locale: "en_US",
      url: canonical,
      siteName: SITE_NAME,
      title: fullTitle,
      description,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: `${title} — ${SITE_NAME}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [image],
    },
  };
}

/** @deprecated Use generateMetadata — kept for existing imports */
export const createPageMetadata = generateMetadata;
