import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { getPricingSettings } from "./app-settings";

type RateLimitResult = { success: boolean; remaining: number; reset: number };

const memoryStore = new Map<string, { count: number; resetAt: number }>();

function memoryRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const entry = memoryStore.get(key);

  if (!entry || now >= entry.resetAt) {
    memoryStore.set(key, { count: 1, resetAt: now + windowMs });
    return { success: true, remaining: limit - 1, reset: now + windowMs };
  }

  if (entry.count >= limit) {
    return { success: false, remaining: 0, reset: entry.resetAt };
  }

  entry.count += 1;
  return { success: true, remaining: limit - entry.count, reset: entry.resetAt };
}

function createUpstashLimiter(
  id: string,
  requests: number,
  window: `${number} ${"s" | "m" | "h" | "d"}`
) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;

  const redis = new Redis({ url, token });
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(requests, window),
    prefix: `resume-optimizer:${id}`,
  });
}

const optimizeUpstash = createUpstashLimiter(
  "optimize",
  parseInt(process.env.RATE_LIMIT_OPTIMIZE_PER_HOUR || "5", 10) || 5,
  "1 h"
);

const exportUpstash = createUpstashLimiter("export", 20, "1 h");
const parseUpstash = createUpstashLimiter("parse", 15, "1 h");
const previewUpstash = createUpstashLimiter("preview", 30, "1 h");
const analyticsUpstash = createUpstashLimiter("analytics", 60, "1 h");
const statsUpstash = createUpstashLimiter("stats", 120, "1 h");

async function runLimit(
  upstash: Ratelimit | null,
  memoryKey: string,
  memoryLimit: number,
  windowMs: number
): Promise<RateLimitResult> {
  if (upstash) {
    const result = await upstash.limit(memoryKey);
    return {
      success: result.success,
      remaining: result.remaining,
      reset: result.reset,
    };
  }
  return memoryRateLimit(memoryKey, memoryLimit, windowMs);
}

export async function rateLimitOptimize(identifier: string): Promise<RateLimitResult> {
  if (
    process.env.NODE_ENV === "development" &&
    process.env.RATE_LIMIT_IN_DEV !== "true"
  ) {
    return { success: true, remaining: 999, reset: Date.now() + 60 * 60 * 1000 };
  }

  const settings = await getPricingSettings();
  const limit = settings.rateLimitOptimizePerHour || 5;
  return runLimit(optimizeUpstash, `optimize:${identifier}`, limit, 60 * 60 * 1000);
}

export async function rateLimitExport(identifier: string): Promise<RateLimitResult> {
  return runLimit(exportUpstash, `export:${identifier}`, 20, 60 * 60 * 1000);
}

export async function rateLimitParse(identifier: string): Promise<RateLimitResult> {
  return runLimit(parseUpstash, `parse:${identifier}`, 15, 60 * 60 * 1000);
}

export async function rateLimitPreview(identifier: string): Promise<RateLimitResult> {
  return runLimit(previewUpstash, `preview:${identifier}`, 30, 60 * 60 * 1000);
}

export async function rateLimitAnalytics(identifier: string): Promise<RateLimitResult> {
  return runLimit(analyticsUpstash, `analytics:${identifier}`, 60, 60 * 60 * 1000);
}

export async function rateLimitStats(identifier: string): Promise<RateLimitResult> {
  return runLimit(statsUpstash, `stats:${identifier}`, 120, 60 * 60 * 1000);
}

export function isUpstashConfigured(): boolean {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}
