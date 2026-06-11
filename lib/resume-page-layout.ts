import type { ResumeDocument } from "@/types/resume-document";
import { documentToPlainText, parseOptimizedDocumentJson, validateDocument } from "./resume-schema";
import { finalizeResumeDocument } from "./resume-document-normalize";
import type { PageLayoutMode } from "@/types";

const DOCUMENT_SYSTEM = `You are a resume layout editor. Return ONLY valid ResumeDocument JSON with the same schema.
Never invent employers, degrees, or metrics. Preserve factual accuracy from the input.`;

function buildSinglePagePrompt(doc: ResumeDocument, jobDescription: string): string {
  return `Compress this resume JSON to fit ONE printed page (~500–650 words total) while keeping ATS strength.

RULES:
- Keep ALL jobs and education entries (same array lengths).
- Merge or shorten bullets: max 3–4 bullets per recent job, 2–3 for older roles.
- Shorten summary to 2–3 sentences.
- Trim skills to 5–10 per category; keep JD-relevant keywords.
- Remove duplicate or low-impact bullets — combine similar ones.
- Do NOT remove entire sections.

JOB DESCRIPTION (keep keyword alignment):
${jobDescription.slice(0, 3000)}

RESUME JSON:
${JSON.stringify(doc)}

Return ONLY the compressed JSON.`;
}

function buildFillPagePrompt(doc: ResumeDocument, jobDescription: string): string {
  return `Expand this resume JSON so it fills roughly ONE full page (~550–700 words) without fluff.

RULES:
- Keep ALL jobs, education, projects (same array lengths).
- Add detail to sparse bullets using ONLY facts from the original — do not invent metrics.
- Summary: expand to 3–4 sentences with JD keywords.
- Each experience entry: aim for 3–5 strong bullets if the original had fewer.
- Skills: 4–6 categories, 6–12 skills each — match original categories, JD terms first.
- Do NOT add fake employers, degrees, or numbers.

JOB DESCRIPTION:
${jobDescription.slice(0, 3000)}

RESUME JSON:
${JSON.stringify(doc)}

Return ONLY the expanded JSON.`;
}

async function callLayoutModel(
  userPrompt: string,
  callWithRetry: (system: string, user: string) => Promise<string>
): Promise<ResumeDocument | null> {
  const raw = await callWithRetry(DOCUMENT_SYSTEM, userPrompt);
  const parsed = parseOptimizedDocumentJson(raw);
  if (!parsed || !validateDocument(parsed)) return null;
  parsed.rawPlainText = documentToPlainText(parsed);
  return parsed;
}

export async function applyPageLayoutToDocument(
  doc: ResumeDocument,
  original: ResumeDocument,
  jobDescription: string,
  mode: PageLayoutMode,
  callWithRetry: (system: string, user: string) => Promise<string>
): Promise<ResumeDocument> {
  if (mode === "balanced") return doc;

  const prompt =
    mode === "single_page"
      ? buildSinglePagePrompt(doc, jobDescription)
      : buildFillPagePrompt(doc, jobDescription);

  const adjusted = await callLayoutModel(prompt, callWithRetry);
  if (!adjusted) return doc;

  return finalizeResumeDocument(original, adjusted);
}

export function buildPageLayoutRetryFromLatexIssue(
  mode: "single_page" | "fill_page",
  doc: ResumeDocument,
  jobDescription: string
): string {
  return mode === "single_page"
    ? buildSinglePagePrompt(doc, jobDescription)
    : buildFillPagePrompt(doc, jobDescription);
}
