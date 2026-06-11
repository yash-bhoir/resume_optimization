import {
  sanitizeLatexOutput,
  wrapLatexContent,
  extractDocumentContent,
  normalizeLatexBody,
  validateLatexStructure,
} from "./latex-template";
import {
  validateCompleteness,
  buildCompletenessRetryPrompt,
} from "./resume-completeness";
import { normalizeContact } from "./contact-normalize";
import {
  validateExperienceBulletMetrics,
  validateDocumentExperienceMetrics,
  buildMetricRetryPrompt,
} from "./metric-validator";
import {
  detectRepetition,
  buildRepetitionRetryPrompt,
} from "./resume-analysis";
import { resumeToPlainText } from "./resume-text";
import type { ResumeDocument } from "@/types/resume-document";
import {
  DOCUMENT_SYSTEM_PROMPT,
  buildDocumentOptimizePrompt,
} from "./resume-optimize-prompt";
import {
  documentToPlainText,
  parseOptimizedDocumentJson,
  validateDocument,
} from "./resume-schema";
import {
  buildDocumentCompletenessRetryPrompt,
  finalizeResumeDocument,
  validateDocumentCompleteness,
} from "./resume-document-normalize";
import { applyPageLayoutToDocument } from "./resume-page-layout";
import type { PageLayoutMode } from "@/types";

const TIMEOUT_MS = 60000;
const MAX_RETRIES = 2;
const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

function getApiKey(): string {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }
  return apiKey;
}

function isRateLimitError(message: string): boolean {
  return (
    message.includes("429") ||
    message.includes("rate limit") ||
    message.includes("Rate limit") ||
    message.includes("quota") ||
    message.includes("insufficient_quota")
  );
}

function friendlyRateLimitMessage(): string {
  return (
    "OpenAI rate limit or quota reached. Wait a minute and try again, " +
    "or check billing at https://platform.openai.com/account/billing"
  );
}

async function callOpenAI(systemPrompt: string, userPrompt: string): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getApiKey()}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.4,
        max_tokens: 8192,
      }),
      signal: controller.signal,
    });

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string }; finish_reason?: string }>;
      error?: { message?: string };
    };

    if (!response.ok) {
      throw new Error(data.error?.message || `OpenAI API error (${response.status})`);
    }

    const choice = data.choices?.[0];
    const text = choice?.message?.content;
    if (!text) throw new Error("Empty response from OpenAI");
    if (choice?.finish_reason === "length") {
      throw new Error("OpenAI response was truncated — retrying with shorter input may help");
    }
    return text;
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error("OpenAI API request timed out");
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function callWithRetry(systemPrompt: string, userPrompt: string): Promise<string> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await callOpenAI(systemPrompt, userPrompt);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      const msg = lastError.message;

      if (isRateLimitError(msg)) {
        if (attempt < MAX_RETRIES) {
          await new Promise((r) => setTimeout(r, 5000 * (attempt + 1)));
          continue;
        }
        throw new Error(friendlyRateLimitMessage());
      }

      if (attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
      }
    }
  }

  throw lastError || new Error("OpenAI API call failed");
}

export async function optimizeResume(
  systemPrompt: string,
  userPrompt: string,
  originalResumeText?: string
): Promise<string> {
  let raw = await callWithRetry(systemPrompt, userPrompt);
  let content = normalizeLatexBody(extractDocumentContent(sanitizeLatexOutput(raw)) || sanitizeLatexOutput(raw));

  if (!validateLatexStructure(content)) {
    const retryPrompt = `${userPrompt}\n\nYour previous output did NOT follow the Jake Gutierrez template. You MUST include: \\begin{center}, \\section{}, \\resumeSubheading, \\resumeItem, \\section{Technical Skills} with at least 2 skill categories (\\textbf{Category}{: skills}). Return corrected LaTeX body only. Do NOT remove any content.`;
    raw = await callWithRetry(systemPrompt, retryPrompt);
    content = normalizeLatexBody(extractDocumentContent(sanitizeLatexOutput(raw)) || sanitizeLatexOutput(raw));
  }

  if (originalResumeText) {
    const check = validateCompleteness(originalResumeText, content);
    if (!check.ok) {
      const retryPrompt = `${userPrompt}\n\n${buildCompletenessRetryPrompt(check.issues)}`;
      raw = await callWithRetry(systemPrompt, retryPrompt);
      content = normalizeLatexBody(extractDocumentContent(sanitizeLatexOutput(raw)) || sanitizeLatexOutput(raw));
    }
  }

  for (let attempt = 0; attempt < 2; attempt++) {
    const metrics = validateExperienceBulletMetrics(content, true);
    if (metrics.ok || metrics.missing.length === 0) break;
    const retryPrompt = `${userPrompt}\n\n${buildMetricRetryPrompt(metrics.missing)}`;
    raw = await callWithRetry(systemPrompt, retryPrompt);
    content = normalizeLatexBody(extractDocumentContent(sanitizeLatexOutput(raw)) || sanitizeLatexOutput(raw));
  }

  for (let attempt = 0; attempt < 2; attempt++) {
    const plain = resumeToPlainText(content, true);
    const repetitionWarnings = detectRepetition(plain);
    if (repetitionWarnings.length === 0) break;
    const retryPrompt = `${userPrompt}\n\n${buildRepetitionRetryPrompt(repetitionWarnings)}`;
    raw = await callWithRetry(systemPrompt, retryPrompt);
    content = normalizeLatexBody(extractDocumentContent(sanitizeLatexOutput(raw)) || sanitizeLatexOutput(raw));
  }

  return wrapLatexContent(content);
}

export async function optimizeResumeDocument(
  doc: ResumeDocument,
  jobDescription: string,
  pageLayout: PageLayoutMode = "balanced"
): Promise<ResumeDocument> {
  const prompt = buildDocumentOptimizePrompt(doc, jobDescription);
  let raw = await callWithRetry(DOCUMENT_SYSTEM_PROMPT, prompt);
  let optimized = parseOptimizedDocumentJson(raw);

  if (!optimized || !validateDocument(optimized)) {
    const retryPrompt = `${prompt}\n\nYour previous response was not valid JSON. Return ONLY the complete optimized ResumeDocument JSON object.`;
    raw = await callWithRetry(DOCUMENT_SYSTEM_PROMPT, retryPrompt);
    optimized = parseOptimizedDocumentJson(raw);
  }

  if (!optimized || !validateDocument(optimized)) {
    throw new Error("Failed to parse optimized resume JSON from AI");
  }

  optimized = finalizeResumeDocument(doc, optimized);

  const completeness = validateDocumentCompleteness(doc, optimized);
  if (!completeness.ok) {
    const retryPrompt = `${prompt}\n\n${buildDocumentCompletenessRetryPrompt(completeness.issues)}`;
    raw = await callWithRetry(DOCUMENT_SYSTEM_PROMPT, retryPrompt);
    const retryDoc = parseOptimizedDocumentJson(raw);
    if (retryDoc && validateDocument(retryDoc)) {
      optimized = finalizeResumeDocument(doc, retryDoc);
    }
  }

  optimized.contact = normalizeContact(optimized.contact);
  optimized.rawPlainText = documentToPlainText(optimized);

  const metrics = validateDocumentExperienceMetrics(optimized);
  if (!metrics.ok && metrics.missing.length > 4) {
    const retryPrompt = `${prompt}\n\n${buildMetricRetryPrompt(metrics.missing.slice(0, 6))}\n\nReturn corrected JSON only. Do not invent metrics.`;
    raw = await callWithRetry(DOCUMENT_SYSTEM_PROMPT, retryPrompt);
    const retryDoc = parseOptimizedDocumentJson(raw);
    if (retryDoc && validateDocument(retryDoc)) {
      optimized = finalizeResumeDocument(doc, retryDoc);
      optimized.contact = normalizeContact(optimized.contact);
      optimized.rawPlainText = documentToPlainText(optimized);
    }
  }

  const repetitionWarnings = detectRepetition(optimized.rawPlainText);
  if (repetitionWarnings.length > 2) {
    const retryPrompt = `${prompt}\n\n${buildRepetitionRetryPrompt(repetitionWarnings.slice(0, 4))}\n\nReturn corrected JSON only.`;
    raw = await callWithRetry(DOCUMENT_SYSTEM_PROMPT, retryPrompt);
    const retryDoc = parseOptimizedDocumentJson(raw);
    if (retryDoc && validateDocument(retryDoc)) {
      optimized = finalizeResumeDocument(doc, retryDoc);
      optimized.contact = normalizeContact(optimized.contact);
      optimized.rawPlainText = documentToPlainText(optimized);
    }
  }

  if (pageLayout !== "balanced") {
    optimized = await applyPageLayoutToDocument(
      optimized,
      doc,
      jobDescription,
      pageLayout,
      callWithRetry
    );
    optimized = finalizeResumeDocument(doc, optimized);
    optimized.contact = normalizeContact(optimized.contact);
    optimized.rawPlainText = documentToPlainText(optimized);
  }

  return optimized;
}

export async function reflowResumeDocument(
  doc: ResumeDocument,
  original: ResumeDocument,
  jobDescription: string,
  pageLayout: PageLayoutMode
): Promise<ResumeDocument> {
  if (pageLayout === "balanced") return doc;
  const adjusted = await applyPageLayoutToDocument(
    doc,
    original,
    jobDescription,
    pageLayout,
    callWithRetry
  );
  return finalizeResumeDocument(original, adjusted);
}
