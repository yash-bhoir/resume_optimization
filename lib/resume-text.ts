import { htmlToPlainText, latexToHtml, stripLatexPipeMarkers } from "./latex-to-html";

export function isLatexSource(text: string): boolean {
  return /\\resumeItem|\\section\{|\\begin\{document\}|\\resumeSubheading/.test(text);
}

/** Strip inline LaTeX fragment while keeping brace text (for bullets). */
export function stripLatexInline(fragment: string): string {
  let s = stripLatexPipeMarkers(fragment).replace(/\\%/g, "%");
  for (let i = 0; i < 16; i++) {
    const next = s
      .replace(/\\href\{[^}]*\}\{([^}]*)\}/g, "$1")
      .replace(/\\textbf\{([^{}]*)\}/g, "$1")
      .replace(/\\textit\{([^{}]*)\}/g, "$1")
      .replace(/\\emph\{([^{}]*)\}/g, "$1")
      .replace(/\\small\{([^{}]*)\}/g, "$1")
      .replace(/\\section\{([^{}]*)\}/g, "$1");
    if (next === s) break;
    s = next;
  }
  return s
    .replace(/\\[a-zA-Z@]+\*?(\[[^\]]*\])?/g, " ")
    .replace(/\$/g, " ")
    .replace(/[{}]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/** Full LaTeX → plain text via HTML renderer (accurate for scoring). */
export function latexToPlainText(latexSource: string): string {
  try {
    const html = latexToHtml(latexSource);
    const plain = htmlToPlainText(html);
    return plain.replace(/\s+/g, " ").toLowerCase().trim();
  } catch {
    return stripLatexInline(latexSource);
  }
}

/** Normalize any resume source to plain lowercase text for ATS scoring. */
export function stripLatex(text: string): string {
  if (isLatexSource(text)) {
    return latexToPlainText(text);
  }
  return text.replace(/\s+/g, " ").toLowerCase().trim();
}

export function resumeToPlainText(source: string, isLatex?: boolean): string {
  if (isLatex ?? isLatexSource(source)) {
    return latexToPlainText(source);
  }
  return source.trim().toLowerCase();
}

export function countResumeElements(text: string, isLatex: boolean): {
  jobCount: number;
  projectCount: number;
  bulletCount: number;
  skillCategories: number;
  charCount: number;
} {
  const plain = resumeToPlainText(text, isLatex);
  const source = isLatex ? text : plain;

  const jobCount = isLatex
    ? (source.match(/\\resumeSubheading/g) || []).length
    : estimateSectionEntries(plain, ["experience", "work history", "employment"]);

  const projectCount = isLatex
    ? (source.match(/\\resumeProjectHeading/g) || []).length
    : estimateSectionEntries(plain, ["projects", "personal projects"]);

  const bulletCount = isLatex
    ? (source.match(/\\resumeItem/g) || []).length
    : countPlainBullets(text);

  const skillCategories = isLatex
    ? (source.match(/\\textbf\{[^}]+\}\{:/g) || []).length
    : estimateSkillCategories(plain);

  return {
    jobCount,
    projectCount,
    bulletCount,
    skillCategories,
    charCount: plain.length,
  };
}

function countPlainBullets(text: string): number {
  return text
    .split(/\n/)
    .filter((l) => /^[\s•\-\*]/.test(l) || /^\s{2,}\S/.test(l))
    .filter((l) => l.replace(/^[\s•\-\*]+/, "").trim().length > 20).length;
}

function estimateSectionEntries(plain: string, sectionNames: string[]): number {
  for (const name of sectionNames) {
    const idx = plain.indexOf(name);
    if (idx === -1) continue;
    const slice = plain.slice(idx, idx + 2000);
    const years = slice.match(/\b20\d{2}\b/g) || [];
    return Math.max(1, Math.min(years.length, 6));
  }
  return 0;
}

function estimateSkillCategories(plain: string): number {
  const idx = plain.search(/technical skills|skills/);
  if (idx === -1) return 0;
  const slice = plain.slice(idx, idx + 800);
  return (slice.match(/(?:languages|frontend|backend|databases|tools|frameworks)/gi) || []).length;
}
