import { countResumeElements } from "./resume-text";

export interface CompletenessCheck {
  ok: boolean;
  issues: string[];
}

export function validateCompleteness(
  originalText: string,
  optimizedLatex: string
): CompletenessCheck {
  const issues: string[] = [];
  const before = countResumeElements(originalText, false);
  const after = countResumeElements(optimizedLatex, true);

  if (before.jobCount > 0 && after.jobCount < before.jobCount) {
    issues.push(
      `Missing experience entries: original has ${before.jobCount}, optimized has ${after.jobCount}`
    );
  }

  if (before.projectCount > 0 && after.projectCount < before.projectCount) {
    issues.push(
      `Missing projects: original has ${before.projectCount}, optimized has ${after.projectCount}`
    );
  }

  if (before.bulletCount > 2 && after.bulletCount < before.bulletCount * 0.7) {
    issues.push(
      `Too many bullets removed: original ${before.bulletCount}, optimized ${after.bulletCount}`
    );
  }

  if (!optimizedLatex.includes("\\section{Technical Skills}")) {
    issues.push("Technical Skills section is missing");
  }

  if (after.skillCategories < 2) {
    issues.push("Technical Skills section appears incomplete (fewer than 2 categories)");
  }

  return { ok: issues.length === 0, issues };
}

export function buildCompletenessRetryPrompt(issues: string[]): string {
  return `Your previous output was INCOMPLETE. Fix these issues:
${issues.map((i) => `- ${i}`).join("\n")}

Restore ALL jobs, projects, education entries, bullets, and skill categories from the original resume.
Do NOT shorten or remove content. Two pages is acceptable.
Return ONLY corrected LaTeX body content using the exact Jake Gutierrez template.`;
}
