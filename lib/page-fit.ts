import { extractDocumentContent } from "./latex-template";

const LETTER_PAGE_HEIGHT_PX = 1056;

export type PageFitResult = {
  ratio: number;
  pageFit: number;
  pageCount: number;
  issue: "ok" | "overflow" | "underflow";
};

/** Two-page resumes are acceptable — report page count instead of penalizing overflow. */
export function estimatePageFitFromLatex(latexSource: string): PageFitResult {
  const content = extractDocumentContent(latexSource);
  const charCount = content.replace(/\\[a-zA-Z@]+(\[[^\]]*\])?(\{[^}]*\})?/g, "").length;
  const bulletCount = (content.match(/\\resumeItem/g) || []).length;
  const sectionCount = (content.match(/\\section/g) || []).length;

  const estimatedHeight =
    120 + sectionCount * 36 + bulletCount * 22 + charCount * 0.35;

  const ratio = estimatedHeight / LETTER_PAGE_HEIGHT_PX;
  const pageCount = Math.max(1, Math.ceil(ratio));

  return {
    ratio,
    pageFit: 100,
    pageCount,
    issue: ratio > 2.1 ? "overflow" : ratio < 0.5 ? "underflow" : "ok",
  };
}

export function measureDomPageFit(container: HTMLElement | null): PageFitResult {
  if (!container) {
    return { ratio: 1, pageFit: 100, pageCount: 1, issue: "ok" };
  }

  const contentHeight = container.scrollHeight;
  const ratio = contentHeight / LETTER_PAGE_HEIGHT_PX;
  const pageCount = Math.max(1, Math.ceil(ratio));

  return {
    ratio,
    pageFit: 100,
    pageCount,
    issue: ratio > 2.1 ? "overflow" : ratio < 0.5 ? "underflow" : "ok",
  };
}

export const LETTER_PAGE_HEIGHT = LETTER_PAGE_HEIGHT_PX;
