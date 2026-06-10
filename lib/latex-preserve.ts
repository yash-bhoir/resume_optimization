import type { ResumeDocument } from "@/types/resume-document";

function extractBraceContent(text: string, startIndex: number): string {
  let i = startIndex;
  while (i < text.length && text[i] !== "{") i++;
  if (i >= text.length) return "";
  let depth = 1;
  let j = i + 1;
  while (j < text.length && depth > 0) {
    if (text[j] === "{") depth++;
    if (text[j] === "}") depth--;
    j++;
  }
  return text.slice(i + 1, j - 1);
}

function replaceResumeItems(section: string, bullets: string[]): string {
  let result = section;
  let bulletIdx = 0;
  const regex = /\\resumeItem\{/g;
  let match;
  const replacements: { start: number; end: number; newContent: string }[] = [];

  while ((match = regex.exec(section)) !== null) {
    const contentStart = match.index + "\\resumeItem{".length;
    let depth = 1;
    let j = contentStart;
    while (j < section.length && depth > 0) {
      if (section[j] === "{") depth++;
      if (section[j] === "}") depth--;
      j++;
    }
    if (bulletIdx < bullets.length) {
      replacements.push({
        start: contentStart,
        end: j - 1,
        newContent: bullets[bulletIdx],
      });
      bulletIdx++;
    }
  }

  let offset = 0;
  for (const r of replacements) {
    const before = result.slice(0, r.start + offset);
    const after = result.slice(r.end + offset);
    result = before + r.newContent + after;
    offset += r.newContent.length - (r.end - r.start);
  }

  return result;
}

export function mergeDocumentIntoLatex(
  originalLatex: string,
  optimized: ResumeDocument
): string {
  let latex = originalLatex;

  if (optimized.summary) {
    latex = latex.replace(
      /(\\section\{Summary\}[\s\S]*?\\small\{)([^}]*)(\})/i,
      `$1${optimized.summary}$3`
    );
  }

  const expMatch = latex.match(/(\\section\{Experience\})([\s\S]*?)(?=\\section\{|$)/i);
  if (expMatch && optimized.experience.length) {
    let expSection = expMatch[2];
    const allBullets = optimized.experience.flatMap((j) => j.bullets);
    expSection = replaceResumeItems(expSection, allBullets);
    latex = latex.replace(expMatch[0], expMatch[1] + expSection);
  }

  const projMatch = latex.match(/(\\section\{Projects\})([\s\S]*?)(?=\\section\{|$)/i);
  if (projMatch && optimized.projects.length) {
    let projSection = projMatch[2];
    const allBullets = optimized.projects.flatMap((p) => p.bullets);
    projSection = replaceResumeItems(projSection, allBullets);
    latex = latex.replace(projMatch[0], projMatch[1] + projSection);
  }

  if (optimized.skills.length) {
    const skillsBlock = optimized.skills
      .map((s) => `     \\textbf{${s.category}}{: ${s.skills}} \\\\`)
      .join("\n");
    latex = latex.replace(
      /(\\section\{Technical Skills\}[\s\S]*?\\small\{\\item\{)([\s\S]*?)(\}\})/i,
      `$1\n${skillsBlock}\n    $3`
    );
  }

  return latex;
}
