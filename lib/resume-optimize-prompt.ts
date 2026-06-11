import type { ResumeDocument } from "@/types/resume-document";
import { extractPriorityKeywords } from "./match-score";

export const DOCUMENT_SYSTEM_PROMPT = `You are a professional resume optimizer. You receive a structured resume JSON and a job description.
Return ONLY valid JSON matching the same schema — optimize content for ATS and recruiter selection.

RULES:
- Preserve ALL jobs, projects, education entries (same array lengths as input).
- Preserve skill categories from the original — same category names, 5–12 skills per line.
- Do NOT dump every JD keyword into skills — only include skills the candidate actually has.
- Add metrics only where they already exist or can be inferred truthfully — NEVER invent numbers.
- NEVER use first person (I, my, me). No "responsible for", "worked on".
- Vary action verbs — max 2 uses per verb (designed→architected/built, managed→led/oversaw).
- Contact links: use full URLs with https:// for LinkedIn and GitHub.
- Inject JD keywords into summary and experience bullets naturally — not as a keyword list.
- Summary: 2–4 sentences, third person, role + years + stack + metrics where truthful.
- Experience: keep every original bullet — reword for impact; aim for 3–5 bullets per role when original had them.
- Skills: 3–6 categories (e.g. Languages, Frontend, Backend, Databases, Tools). Put JD-relevant terms first in each line.
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
