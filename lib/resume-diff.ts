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
