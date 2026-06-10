import type { ResumeContact } from "@/types/resume-document";

export function ensureHttpsUrl(url: string | undefined): string {
  if (!url) return "";
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function normalizeContact(contact: ResumeContact): ResumeContact {
  return {
    ...contact,
    linkedin: ensureHttpsUrl(contact.linkedin),
    github: ensureHttpsUrl(contact.github),
  };
}

/** Fix \\href{linkedin.com/...} without protocol in LaTeX output. */
export function normalizeLatexContactUrls(latex: string): string {
  return latex
    .replace(
      /\\href\{(?!https?:\/\/)(linkedin\.com\/[^}]+)\}/gi,
      (_m, path: string) => `\\href{https://${path}}`
    )
    .replace(
      /\\href\{(?!https?:\/\/)(github\.com\/[^}]+)\}/gi,
      (_m, path: string) => `\\href{https://${path}}`
    )
    .replace(
      /\\href\{(?!https?:\/\/)(www\.linkedin\.com\/[^}]+)\}/gi,
      (_m, path: string) => `\\href{https://${path}}`
    );
}
