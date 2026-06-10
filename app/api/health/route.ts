import { isClerkConfigured } from "@/lib/clerk-env";
import { connectDB } from "@/lib/mongodb";
import { ensureUserIndexes } from "@/lib/models/User";
import { isUpstashConfigured } from "@/lib/rate-limit";
import { resolveBrowserExecutable } from "@/lib/puppeteer-browser";
import { jsonOk } from "@/lib/api-response";
const startedAt = Date.now();
const APP_VERSION = process.env.npm_package_version || "1.0.0";

function openAiKeyStatus(): string {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) return "missing_key";
  if (!key.startsWith("sk-")) return "invalid_format";
  return "ok";
}

export async function GET() {
  const checks: Record<string, string | number> = {
    clerk: isClerkConfigured() ? "ok" : "missing_keys",
    openai: openAiKeyStatus(),
    mongodb: "skipped",
    chrome: resolveBrowserExecutable() ? "ok" : "missing",
    rateLimit: isUpstashConfigured() ? "upstash" : "memory",
    redis: isUpstashConfigured() ? "configured" : "not_configured",
  };

  let mongoLatencyMs = -1;
  try {
    const start = Date.now();
    await connectDB();
    await ensureUserIndexes();
    mongoLatencyMs = Date.now() - start;
    checks.mongodb = "ok";
    checks.mongodbLatencyMs = mongoLatencyMs;
  } catch {
    checks.mongodb = "error";
  }

  const criticalDown =
    checks.openai !== "ok" || checks.mongodb === "error";
  const degraded =
    !criticalDown &&
    (checks.chrome === "missing" || checks.rateLimit === "memory");

  const status = criticalDown ? "down" : degraded ? "degraded" : "ok";

  return jsonOk({
    status,
    service: "resume-optimizer",
    version: APP_VERSION,
    uptimeSeconds: Math.floor((Date.now() - startedAt) / 1000),
    checks,
  });
}
