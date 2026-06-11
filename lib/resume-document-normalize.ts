import type { ResumeDocument, SkillCategory } from "@/types/resume-document";

export interface DocumentCompletenessCheck {
  ok: boolean;
  issues: string[];
}

const MAX_SKILLS_PER_CATEGORY = 14;
const MIN_BULLET_RATIO = 0.75;

function splitSkillTokens(raw: string): string[] {
  return raw
    .split(/[,;|/•·]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && s.length < 80);
}

function dedupeSkills(tokens: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const token of tokens) {
    const key = token.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(token);
  }
  return out;
}

function normalizeCategoryName(name: string): string {
  return name.trim().replace(/\s+/g, " ");
}

/** Keep skills structured: dedupe, cap count, preserve categories from original. */
export function normalizeSkillsCategories(
  optimized: SkillCategory[],
  original: SkillCategory[]
): SkillCategory[] {
  const originalByKey = new Map(
    original.map((s) => [normalizeCategoryName(s.category).toLowerCase(), s])
  );

  const merged: SkillCategory[] = [];

  for (const cat of optimized) {
    const key = normalizeCategoryName(cat.category).toLowerCase();
    const orig = originalByKey.get(key);
    const tokens = dedupeSkills([
      ...splitSkillTokens(cat.skills),
      ...(orig ? splitSkillTokens(orig.skills) : []),
    ]).slice(0, MAX_SKILLS_PER_CATEGORY);

    if (tokens.length === 0) continue;
    merged.push({
      category: normalizeCategoryName(cat.category),
      skills: tokens.join(", "),
    });
    originalByKey.delete(key);
  }

  for (const [, orig] of originalByKey) {
    const tokens = dedupeSkills(splitSkillTokens(orig.skills)).slice(0, MAX_SKILLS_PER_CATEGORY);
    if (tokens.length === 0) continue;
    merged.push({
      category: normalizeCategoryName(orig.category),
      skills: tokens.join(", "),
    });
  }

  if (merged.length === 0 && original.length > 0) {
    return original.map((s) => ({
      category: normalizeCategoryName(s.category),
      skills: dedupeSkills(splitSkillTokens(s.skills)).slice(0, MAX_SKILLS_PER_CATEGORY).join(", "),
    }));
  }

  return merged;
}

export function validateDocumentCompleteness(
  original: ResumeDocument,
  optimized: ResumeDocument
): DocumentCompletenessCheck {
  const issues: string[] = [];

  if (original.experience.length > 0 && optimized.experience.length < original.experience.length) {
    issues.push(
      `Missing jobs: original ${original.experience.length}, optimized ${optimized.experience.length}`
    );
  }

  if (original.education.length > 0 && optimized.education.length < original.education.length) {
    issues.push(
      `Missing education: original ${original.education.length}, optimized ${optimized.education.length}`
    );
  }

  if (original.projects.length > 0 && optimized.projects.length < original.projects.length) {
    issues.push(
      `Missing projects: original ${original.projects.length}, optimized ${optimized.projects.length}`
    );
  }

  const origBullets = original.experience.reduce((n, j) => n + j.bullets.length, 0);
  const optBullets = optimized.experience.reduce((n, j) => n + j.bullets.length, 0);
  if (origBullets > 2 && optBullets < origBullets * MIN_BULLET_RATIO) {
    issues.push(
      `Too many bullets removed: original ${origBullets}, optimized ${optBullets}`
    );
  }

  if (original.skills.length >= 2 && optimized.skills.length < Math.min(original.skills.length, 2)) {
    issues.push("Technical skills section lost categories");
  }

  for (const cat of optimized.skills) {
    const count = splitSkillTokens(cat.skills).length;
    if (count > MAX_SKILLS_PER_CATEGORY + 4) {
      issues.push(`Skills category "${cat.category}" has too many items (${count})`);
    }
  }

  if (!optimized.summary || optimized.summary.length < 40) {
    issues.push("Summary is missing or too short");
  }

  return { ok: issues.length === 0, issues };
}

export function buildDocumentCompletenessRetryPrompt(issues: string[]): string {
  return `Your previous JSON output was INCOMPLETE or poorly structured. Fix:
${issues.map((i) => `- ${i}`).join("\n")}

Restore ALL jobs, education, projects, and skill categories from the original.
Keep the same array lengths as the original resume.
Do NOT drop bullets — reword them instead.
Skills: use 3–6 categories (Languages, Frontend, Backend, Databases, Tools) with 5–12 comma-separated skills each.
Return ONLY corrected JSON.`;
}

/** Merge optimized content onto original structure so nothing is dropped. */
export function enforceDocumentStructure(
  original: ResumeDocument,
  optimized: ResumeDocument
): ResumeDocument {
  const experience = original.experience.map((job, i) => {
    const opt = optimized.experience[i];
    if (!opt) return { ...job };
    const bullets =
      opt.bullets.length >= job.bullets.length * MIN_BULLET_RATIO
        ? opt.bullets
        : opt.bullets.length > 0
          ? [...opt.bullets, ...job.bullets.slice(opt.bullets.length)]
          : job.bullets;
    return {
      ...job,
      title: opt.title || job.title,
      company: opt.company || job.company,
      location: opt.location || job.location,
      startDate: opt.startDate || job.startDate,
      endDate: opt.endDate || job.endDate,
      bullets,
    };
  });

  const extraJobs = optimized.experience.slice(original.experience.length);
  if (extraJobs.length) {
    experience.push(...extraJobs);
  }

  const education = original.education.map((edu, i) => ({
    ...edu,
    ...optimized.education[i],
    degree: optimized.education[i]?.degree || edu.degree,
    institution: optimized.education[i]?.institution || edu.institution,
  }));

  const projects = original.projects.map((proj, i) => {
    const opt = optimized.projects[i];
    if (!opt) return { ...proj };
    return {
      ...proj,
      name: opt.name || proj.name,
      techStack: opt.techStack || proj.techStack,
      date: opt.date || proj.date,
      bullets: opt.bullets.length ? opt.bullets : proj.bullets,
    };
  });

  return {
    contact: { ...original.contact, ...optimized.contact },
    summary: optimized.summary?.trim() || original.summary,
    experience,
    education: education.length ? education : optimized.education,
    projects: projects.length ? projects : optimized.projects,
    skills: normalizeSkillsCategories(optimized.skills, original.skills),
    rawPlainText: optimized.rawPlainText,
  };
}

export function finalizeResumeDocument(
  original: ResumeDocument,
  optimized: ResumeDocument
): ResumeDocument {
  return enforceDocumentStructure(original, {
    ...optimized,
    skills: normalizeSkillsCategories(optimized.skills, original.skills),
  });
}
