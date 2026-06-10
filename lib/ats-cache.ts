import { createHash } from "crypto";

interface CachedScore {
  matchScoreBefore: number;
  atsScoreBefore: number;
  atsBreakdownBefore: unknown;
  analysisBefore: unknown;
  expiresAt: number;
}

const CACHE_TTL_MS = 15 * 60 * 1000;
const MAX_ENTRIES = 500;
const cache = new Map<string, CachedScore>();

function hashInput(resumeText: string, jobDescription: string): string {
  return createHash("sha256")
    .update(resumeText.trim())
    .update("\0")
    .update(jobDescription.trim())
    .digest("hex");
}

function evictIfNeeded() {
  if (cache.size <= MAX_ENTRIES) return;
  const oldest = [...cache.entries()].sort((a, b) => a[1].expiresAt - b[1].expiresAt);
  for (let i = 0; i < oldest.length - MAX_ENTRIES + 50; i++) {
    cache.delete(oldest[i][0]);
  }
}

export function getCachedScorePreview(
  resumeText: string,
  jobDescription: string
): Omit<CachedScore, "expiresAt"> | null {
  const key = hashInput(resumeText, jobDescription);
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  const { expiresAt: _, ...rest } = entry;
  return rest;
}

export function setCachedScorePreview(
  resumeText: string,
  jobDescription: string,
  value: Omit<CachedScore, "expiresAt">
): void {
  const key = hashInput(resumeText, jobDescription);
  evictIfNeeded();
  cache.set(key, { ...value, expiresAt: Date.now() + CACHE_TTL_MS });
}
