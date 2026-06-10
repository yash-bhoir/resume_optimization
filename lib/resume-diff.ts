import { latexToHtml, htmlToPlainText } from "./latex-to-html";
import { sanitizeHtml } from "./sanitize-html";
import { extractKeywords } from "./match-score";
import { resumeToPlainText, isLatexSource } from "./resume-text";

export interface ChangeItem {
  section: string;
  type: "added" | "removed" | "modified";
  before?: string;
  after?: string;
  summary: string;
}

export interface DiffSegment {
  value: string;
  added?: boolean;
  removed?: boolean;
}

const SECTION_NAMES = [
  "summary",
  "education",
  "experience",
  "projects",
  "technical skills",
  "skills",
];

/** Simple word-level diff (no external dependency). */
export function diffWords(before: string, after: string): DiffSegment[] {
  const a = before.split(/\s+/).filter(Boolean);
  const b = after.split(/\s+/).filter(Boolean);
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) dp[i][j] = dp[i - 1][j - 1] + 1;
      else dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }

  const segments: DiffSegment[] = [];
  let i = m;
  let j = n;

  const stack: DiffSegment[] = [];
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && a[i - 1] === b[j - 1]) {
      stack.push({ value: a[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      stack.push({ value: b[j - 1], added: true });
      j--;
    } else {
      stack.push({ value: a[i - 1], removed: true });
      i--;
    }
  }

  stack.reverse();
  for (const seg of stack) {
    const last = segments[segments.length - 1];
    if (
      last &&
      !!last.added === !!seg.added &&
      !!last.removed === !!seg.removed
    ) {
      last.value += " " + seg.value;
    } else {
      segments.push({ ...seg });
    }
  }

  return segments;
}

export function diffToHtml(segments: DiffSegment[], side: "before" | "after"): string {
  return segments
    .map((seg) => {
      const escaped = escapeHtml(seg.value);
      if (side === "before" && seg.removed) {
        return `<del class="diff-removed">${escaped}</del>`;
      }
      if (side === "after" && seg.added) {
        return `<mark class="diff-added">${escaped}</mark>`;
      }
      if (seg.added || seg.removed) return "";
      return escaped;
    })
    .filter(Boolean)
    .join(" ");
}

export type LineDiffRow =
  | { type: "same"; before: string; after: string }
  | { type: "changed"; before: string; after: string }
  | { type: "removed"; before: string }
  | { type: "added"; after: string };

function normalizeLine(line: string): string {
  return line.toLowerCase().replace(/\s+/g, " ").trim();
}

/** Extract readable lines from any resume source (preserves casing). */
export function extractResumeLines(source: string, isLatex?: boolean): string[] {
  const latex = isLatex ?? isLatexSource(source);
  if (latex) {
    try {
      const html = latexToHtml(source);
      return htmlToPlainText(html)
        .split(/\n/)
        .map((l) => l.trim())
        .filter((l) => l.length > 0);
    } catch {
      /* fall through */
    }
  }
  return source
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
}

/** Line-level diff with removed/added rows paired as changed when adjacent. */
export function diffResumeLines(beforeLines: string[], afterLines: string[]): LineDiffRow[] {
  const m = beforeLines.length;
  const n = afterLines.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (normalizeLine(beforeLines[i - 1]) === normalizeLine(afterLines[j - 1])) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  const stack: LineDiffRow[] = [];
  let i = m;
  let j = n;

  while (i > 0 || j > 0) {
    if (
      i > 0 &&
      j > 0 &&
      normalizeLine(beforeLines[i - 1]) === normalizeLine(afterLines[j - 1])
    ) {
      stack.push({ type: "same", before: beforeLines[i - 1], after: afterLines[j - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      stack.push({ type: "added", after: afterLines[j - 1] });
      j--;
    } else {
      stack.push({ type: "removed", before: beforeLines[i - 1] });
      i--;
    }
  }

  stack.reverse();

  const merged: LineDiffRow[] = [];
  for (let k = 0; k < stack.length; k++) {
    const cur = stack[k];
    const next = stack[k + 1];
    if (cur.type === "removed" && next?.type === "added") {
      merged.push({ type: "changed", before: cur.before, after: next.after });
      k++;
    } else {
      merged.push(cur);
    }
  }
  return merged;
}

const SECTION_LINE =
  /^(summary|education|experience|projects|technical skills|skills|certifications|awards)$/i;

function lineClass(text: string): string {
  if (SECTION_LINE.test(text) || (/^[A-Z][A-Z\s/&-]{2,}$/.test(text) && text.length < 40)) {
    return "diff-section-title";
  }
  if (/^[•\-*]\s/.test(text) || text.length > 120) return "diff-bullet-line";
  return "";
}

export function lineDiffToColumnHtml(rows: LineDiffRow[], side: "before" | "after"): string {
  const parts: string[] = [];

  for (const row of rows) {
    if (row.type === "same") {
      const text = side === "before" ? row.before : row.after;
      parts.push(`<div class="diff-line ${lineClass(text)}">${escapeHtml(text)}</div>`);
      continue;
    }

    if (row.type === "changed") {
      const segments = diffWords(row.before, row.after);
      if (side === "before") {
        const inner = diffToHtml(segments, "before") || escapeHtml(row.before);
        parts.push(`<div class="diff-line diff-line-changed ${lineClass(row.before)}">${inner}</div>`);
      } else {
        const inner = diffToHtml(segments, "after") || escapeHtml(row.after);
        parts.push(`<div class="diff-line diff-line-changed ${lineClass(row.after)}">${inner}</div>`);
      }
      continue;
    }

    if (row.type === "removed" && side === "before") {
      parts.push(
        `<div class="diff-line diff-line-removed ${lineClass(row.before)}"><del class="diff-removed">${escapeHtml(row.before)}</del></div>`
      );
      continue;
    }

    if (row.type === "added" && side === "after") {
      parts.push(
        `<div class="diff-line diff-line-added ${lineClass(row.after)}"><mark class="diff-added">${escapeHtml(row.after)}</mark></div>`
      );
      continue;
    }

    parts.push('<div class="diff-line diff-line-spacer" aria-hidden="true"></div>');
  }

  return `<div class="compare-diff-document">${parts.join("")}</div>`;
}

export function buildHighlightedComparison(
  originalText: string,
  optimizedLatex: string
): { beforeHtml: string; afterHtml: string } {
  const originalIsLatex = isLatexSource(originalText);
  const beforeLines = extractResumeLines(originalText, originalIsLatex);
  const afterLines = extractResumeLines(optimizedLatex, true);
  const rows = diffResumeLines(beforeLines, afterLines);

  return {
    beforeHtml: sanitizeHtml(lineDiffToColumnHtml(rows, "before")),
    afterHtml: sanitizeHtml(lineDiffToColumnHtml(rows, "after")),
  };
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function extractSectionPlain(plain: string, sectionName: string): string {
  const lower = plain.toLowerCase();
  const start = lower.indexOf(sectionName);
  if (start === -1) return "";

  let end = plain.length;
  for (const other of SECTION_NAMES) {
    if (other === sectionName) continue;
    const idx = lower.indexOf(other, start + sectionName.length);
    if (idx !== -1 && idx < end) end = idx;
  }
  return plain.slice(start + sectionName.length, end).trim();
}

export function getNewJdKeywords(
  originalText: string,
  optimizedText: string,
  jobDescription: string,
  isOptimizedLatex: boolean
): string[] {
  const jdKeywords = extractKeywords(jobDescription);
  const originalPlain = resumeToPlainText(originalText, false);
  const optimizedPlain = resumeToPlainText(optimizedText, isOptimizedLatex ?? isLatexSource(optimizedText));

  return jdKeywords.filter(
    (k) => optimizedPlain.includes(k) && !originalPlain.includes(k)
  );
}

export function generateChangeLog(
  originalText: string,
  optimizedLatex: string,
  jobDescription: string
): ChangeItem[] {
  const changes: ChangeItem[] = [];
  const originalPlain = resumeToPlainText(originalText, false);
  const optimizedPlain = resumeToPlainText(optimizedLatex, true);

  const newKeywords = getNewJdKeywords(originalText, optimizedLatex, jobDescription, true);
  if (newKeywords.length > 0) {
    changes.push({
      section: "Keywords",
      type: "added",
      summary: `Added JD keywords: ${newKeywords.slice(0, 8).join(", ")}`,
    });
  }

  for (const section of ["summary", "experience", "projects", "technical skills"]) {
    const before = extractSectionPlain(originalPlain, section);
    const after = extractSectionPlain(optimizedPlain, section);
    if (before && after && before !== after) {
      changes.push({
        section: section.charAt(0).toUpperCase() + section.slice(1),
        type: "modified",
        before: before.slice(0, 150),
        after: after.slice(0, 150),
        summary: `Rewrote ${section} to align with job description and strengthen impact`,
      });
    }
  }

  if (optimizedPlain.length > originalPlain.length) {
    changes.push({
      section: "Content",
      type: "added",
      summary: "Expanded bullets with JD-aligned keywords and measurable achievements",
    });
  }

  changes.push({
    section: "Template",
    type: "modified",
    summary: "Formatted using Jake Gutierrez professional LaTeX template layout",
  });

  return changes.slice(0, 8);
}

export function generateChangeLogSummaries(items: ChangeItem[]): string[] {
  return items.map((c) => c.summary);
}
