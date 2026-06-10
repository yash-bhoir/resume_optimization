import { extractKeywords } from "./match-score";
import { isLatexSource, resumeToPlainText } from "./resume-text";
import type { ChangeItem } from "./resume-diff";

const SECTION_NAMES = [
  "summary",
  "education",
  "experience",
  "projects",
  "technical skills",
  "skills",
];

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
  const optimizedPlain = resumeToPlainText(
    optimizedText,
    isOptimizedLatex ?? isLatexSource(optimizedText)
  );

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

export function generateFallbackChangeLog(
  originalText: string,
  optimizedLatex: string,
  jobDescription: string
): string[] {
  return generateChangeLogSummaries(
    generateChangeLog(originalText, optimizedLatex, jobDescription)
  );
}
