import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { escapeHtml } from "./latex-to-html";
import { sanitizeUrl } from "./sanitize-html";

export type BlogCategory = "ATS Tips" | "Resume Writing" | "Job Search";

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  updated?: string;
  category: BlogCategory;
  content: string;
  readingTimeMinutes: number;
  lastModified: Date;
}

export interface BlogEntry {
  slug: string;
  lastModified: Date;
}

const BLOG_DIR = path.join(process.cwd(), "content", "blog");

const BLOG_EXTENSIONS = [".mdx", ".md"];

function listBlogFiles(): string[] {
  if (!fs.existsSync(BLOG_DIR)) return [];
  return fs
    .readdirSync(BLOG_DIR)
    .filter((file) => BLOG_EXTENSIONS.some((ext) => file.endsWith(ext)));
}

function slugFromFilename(filename: string): string {
  return filename.replace(/\.(mdx|md)$/, "");
}

export function estimateReadingTime(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

export function getAllBlogSlugs(): string[] {
  const seen = new Set<string>();
  const slugs: string[] = [];
  for (const file of listBlogFiles()) {
    const slug = slugFromFilename(file);
    if (!seen.has(slug)) {
      seen.add(slug);
      slugs.push(slug);
    }
  }
  return slugs;
}

export function getAllBlogEntries(): BlogEntry[] {
  return listBlogFiles().map((file) => {
    const slug = slugFromFilename(file);
    const filePath = path.join(BLOG_DIR, file);
    const stat = fs.statSync(filePath);
    return { slug, lastModified: stat.mtime };
  });
}

function resolveBlogFile(slug: string): string | null {
  if (!/^[a-z0-9-]+$/.test(slug)) return null;
  for (const ext of BLOG_EXTENSIONS) {
    const filePath = path.join(BLOG_DIR, `${slug}${ext}`);
    if (fs.existsSync(filePath)) return filePath;
  }
  return null;
}

function normalizeCategory(value: unknown): BlogCategory {
  const raw = String(value ?? "ATS Tips");
  if (raw === "Resume Writing" || raw === "Job Search") return raw;
  return "ATS Tips";
}

export function getBlogPost(slug: string): BlogPost | null {
  const filePath = resolveBlogFile(slug);
  if (!filePath) return null;

  const raw = fs.readFileSync(filePath, "utf-8");
  const stat = fs.statSync(filePath);
  const { data, content } = matter(raw);

  return {
    slug,
    title: String(data.title ?? slug),
    description: String(data.description ?? ""),
    date: String(data.date ?? new Date().toISOString().slice(0, 10)),
    updated: data.updated ? String(data.updated) : undefined,
    category: normalizeCategory(data.category),
    content,
    readingTimeMinutes: estimateReadingTime(content),
    lastModified: stat.mtime,
  };
}

export function getAllBlogPosts(): BlogPost[] {
  const seen = new Set<string>();
  return listBlogFiles()
    .map((file) => getBlogPost(slugFromFilename(file)))
    .filter((post): post is BlogPost => post !== null)
    .filter((post) => {
      if (seen.has(post.slug)) return false;
      seen.add(post.slug);
      return true;
    })
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function getRelatedPosts(slug: string, limit = 3): BlogPost[] {
  const current = getBlogPost(slug);
  if (!current) return getAllBlogPosts().filter((p) => p.slug !== slug).slice(0, limit);

  return getAllBlogPosts()
    .filter((p) => p.slug !== slug)
    .sort((a, b) => {
      const aScore = a.category === current.category ? 1 : 0;
      const bScore = b.category === current.category ? 1 : 0;
      return bScore - aScore || b.date.localeCompare(a.date);
    })
    .slice(0, limit);
}

export function extractHeadings(md: string): { id: string; text: string; level: 2 | 3 }[] {
  const headings: { id: string; text: string; level: 2 | 3 }[] = [];
  for (const line of md.split("\n")) {
    const h2 = line.match(/^## (.+)$/);
    const h3 = line.match(/^### (.+)$/);
    const text = (h2?.[1] ?? h3?.[1])?.trim();
    if (!text) continue;
    const id = text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    headings.push({ id, text, level: h2 ? 2 : 3 });
  }
  return headings;
}

/** Minimal markdown to HTML for blog posts (headings, paragraphs, lists, links) */
export function renderMarkdown(md: string): string {
  const lines = md.split("\n");
  const html: string[] = [];
  let inList = false;

  const closeList = () => {
    if (inList) {
      html.push("</ul>");
      inList = false;
    }
  };

  const slugify = (text: string) =>
    text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

  const inline = (text: string) => {
    const withLinks = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label: string, url: string) => {
      const safeUrl = sanitizeUrl(url);
      return `<a href="${escapeHtml(safeUrl)}" rel="noopener noreferrer">${escapeHtml(label)}</a>`;
    });
    return withLinks
      .replace(/\*\*([^*]+)\*\*/g, (_, s: string) => `<strong>${escapeHtml(s)}</strong>`)
      .replace(/\*([^*]+)\*/g, (_, s: string) => `<em>${escapeHtml(s)}</em>`);
  };

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed) {
      closeList();
      continue;
    }

    if (trimmed.startsWith("### ")) {
      closeList();
      const text = trimmed.slice(4);
      html.push(`<h3 id="${slugify(text)}">${inline(text)}</h3>`);
    } else if (trimmed.startsWith("## ")) {
      closeList();
      const text = trimmed.slice(3);
      html.push(`<h2 id="${slugify(text)}">${inline(text)}</h2>`);
    } else if (trimmed.startsWith("# ")) {
      closeList();
      html.push(`<h1>${inline(trimmed.slice(2))}</h1>`);
    } else if (trimmed.startsWith("- ")) {
      if (!inList) {
        html.push("<ul>");
        inList = true;
      }
      html.push(`<li>${inline(trimmed.slice(2))}</li>`);
    } else {
      closeList();
      html.push(`<p>${inline(trimmed)}</p>`);
    }
  }

  closeList();
  return html.join("\n");
}
