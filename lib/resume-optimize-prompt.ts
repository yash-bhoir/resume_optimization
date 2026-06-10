import type { ResumeDocument } from "@/types/resume-document";
import { extractPriorityKeywords } from "./match-score";

export const DOCUMENT_SYSTEM_PROMPT = `You are a professional resume optimizer. You receive a structured resume JSON and a job description.
Return ONLY valid JSON matching the same schema — optimize content for ATS and recruiter selection.

RULES:
- Preserve ALL jobs, projects, education entries, and skill categories (same array lengths).
- Add metrics only where they already exist or can be inferred truthfully from the original — NEVER invent numbers.
- NEVER use first person (I, my, me). No "responsible for", "worked on".
- Vary action verbs — max 2 uses per verb (designed→architected/built, managed→led/oversaw).
- Contact links: use full URLs with https:// for LinkedIn and GitHub.
- Inject exact JD keywords naturally into summary, bullets, and skills — aim to cover ALL priority keywords below.
- Summary: 2-4 sentences, third person, role + years + stack + metrics where truthful.
- Reorder skills within categories to put JD-relevant skills first.
- Output JSON only. No markdown fences, no explanations.`;

export function buildDocumentOptimizePrompt(
  doc: ResumeDocument,
  jobDescription: string
): string {
  const priorityKeywords = extractPriorityKeywords(jobDescription).slice(0, 24);

  return `Optimize this resume JSON for the job description below.
Return the complete optimized ResumeDocument JSON with the same structure.

PRIORITY JD KEYWORDS — include each naturally at least once where truthful:
${priorityKeywords.length ? priorityKeywords.join(", ") : "(extract from job description)"}

CURRENT RESUME JSON:
${JSON.stringify(doc)}

JOB DESCRIPTION:
${jobDescription}

Required JSON shape:
{
  "contact": { "name", "title", "phone", "email", "linkedin", "github", "location" },
  "summary": "string",
  "experience": [{ "title", "company", "location", "startDate", "endDate", "bullets": [] }],
  "education": [{ "degree", "institution", "location", "startDate", "endDate", "gpa?" }],
  "projects": [{ "name", "techStack", "date", "bullets": [] }],
  "skills": [{ "category", "skills" }],
  "rawPlainText": "leave empty — filled automatically"
}`;
}
