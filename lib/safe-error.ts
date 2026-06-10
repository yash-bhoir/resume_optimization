const OPENAI_PATTERNS = [
  /openai/i,
  /rate limit/i,
  /quota/i,
  /insufficient_quota/i,
  /timed out/i,
  /abort/i,
  /api key/i,
  /401/,
  /429/,
];

const MONGO_PATTERNS = [/mongo/i, /connection/i, /ECONNREFUSED/i, /buffering timed out/i];

const PUPPETEER_PATTERNS = [/chrome/i, /puppeteer/i, /browser/i, /executable/i];

export type SafeErrorCode =
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION_FAILED"
  | "RATE_LIMITED"
  | "QUOTA_EXCEEDED"
  | "FILE_TOO_LARGE"
  | "SERVICE_UNAVAILABLE"
  | "INTERNAL_ERROR";

export function toSafeClientMessage(err: unknown, fallback: string): string {
  const message = err instanceof Error ? err.message : String(err);

  if (OPENAI_PATTERNS.some((p) => p.test(message))) {
    if (/rate limit|quota|429|insufficient_quota/i.test(message)) {
      return "AI service is busy. Wait a minute and try again.";
    }
    if (/timed out|abort/i.test(message)) {
      return "AI service took too long. Try again with a shorter job description.";
    }
    return "AI service is temporarily unavailable. Try again in a moment.";
  }

  if (MONGO_PATTERNS.some((p) => p.test(message))) {
    return "We're having trouble saving your data. Try again in a moment.";
  }

  if (PUPPETEER_PATTERNS.some((p) => p.test(message))) {
    return "PDF export is temporarily unavailable. Try DOCX or LaTeX, or try again shortly.";
  }

  if (/password|encrypted/i.test(message)) {
    return message;
  }

  if (/scanned|extract|parse|empty|upload|file|DOCX|PDF/i.test(message)) {
    return message.length < 200 ? message : fallback;
  }

  if (/Sign in|Pro feature|quota|limit/i.test(message)) {
    return message;
  }

  return fallback;
}

export function toHttpStatusFromError(err: unknown, defaultStatus = 500): number {
  const message = err instanceof Error ? err.message : String(err);
  if (OPENAI_PATTERNS.some((p) => p.test(message))) return 503;
  if (MONGO_PATTERNS.some((p) => p.test(message))) return 503;
  if (PUPPETEER_PATTERNS.some((p) => p.test(message))) return 503;
  return defaultStatus;
}
