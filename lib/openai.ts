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
import {
  validateBulletMetrics,
  buildMetricRetryPrompt,
} from "./metric-validator";
import {
  detectRepetition,
  buildRepetitionRetryPrompt,
} from "./resume-analysis";
import { resumeToPlainText } from "./resume-text";

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

  const metrics = validateBulletMetrics(content, true);
  if (!metrics.ok && metrics.missing.length > 0) {
    const retryPrompt = `${userPrompt}\n\n${buildMetricRetryPrompt(metrics.missing)}`;
    raw = await callWithRetry(systemPrompt, retryPrompt);
    content = normalizeLatexBody(extractDocumentContent(sanitizeLatexOutput(raw)) || sanitizeLatexOutput(raw));
  }

  const plain = resumeToPlainText(content, true);
  const repetitionWarnings = detectRepetition(plain);
  if (repetitionWarnings.length > 0) {
    const retryPrompt = `${userPrompt}\n\n${buildRepetitionRetryPrompt(repetitionWarnings)}`;
    raw = await callWithRetry(systemPrompt, retryPrompt);
    content = normalizeLatexBody(extractDocumentContent(sanitizeLatexOutput(raw)) || sanitizeLatexOutput(raw));
  }

  return wrapLatexContent(content);
}

export function getActiveModel(): string {
  return MODEL;
}
