import { resolveBrowserExecutable } from "./puppeteer-browser";
import { getStripeConfigStatus } from "./stripe";

const REQUIRED_PROD = ["OPENAI_API_KEY", "MONGODB_URI"] as const;

const REQUIRED_WHEN_CLERK = [
  "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
  "CLERK_SECRET_KEY",
] as const;

export interface StartupValidationResult {
  ok: boolean;
  errors: string[];
  warnings: string[];
  environment: string;
}

export function validateStartupEnv(): StartupValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const env = process.env.NODE_ENV || "development";

  for (const key of REQUIRED_PROD) {
    if (!process.env[key]?.trim()) {
      if (env === "production") {
        errors.push(`Missing required env var: ${key}`);
      } else {
        warnings.push(`${key} not set (required in production)`);
      }
    }
  }

  const hasClerkKey = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim());
  const hasClerkSecret = Boolean(process.env.CLERK_SECRET_KEY?.trim());
  if (hasClerkKey !== hasClerkSecret) {
    warnings.push("Clerk keys are partially configured — auth may not work");
  }
  if (env === "production" && hasClerkKey) {
    for (const key of REQUIRED_WHEN_CLERK) {
      if (!process.env[key]?.trim()) {
        errors.push(`Missing required env var: ${key}`);
      }
    }
  }

  const openaiKey = process.env.OPENAI_API_KEY?.trim();
  if (openaiKey && !openaiKey.startsWith("sk-")) {
    warnings.push("OPENAI_API_KEY format looks invalid (expected sk- prefix)");
  }

  if (!process.env.UPSTASH_REDIS_REST_URL && env === "production") {
    warnings.push("UPSTASH_REDIS_REST_URL not set — rate limits use in-memory store per instance");
  }

  if (!resolveBrowserExecutable() && env === "production") {
    warnings.push("Chrome/Edge executable not found — PDF export may fail");
  }

  const stripe = getStripeConfigStatus();
  if (!stripe.checkoutReady) {
    warnings.push(
      `Stripe checkout not configured — add env vars: ${stripe.missing.join(", ") || "STRIPE_*"}`
    );
  } else if (!stripe.webhookReady) {
    warnings.push("STRIPE_WEBHOOK_SECRET not set — payments won't auto-activate plans/credits");
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    environment: env,
  };
}

export function runStartupCheck(): void {
  const result = validateStartupEnv();

  for (const warning of result.warnings) {
    console.warn(`[startup] ${warning}`);
  }

  if (!result.ok) {
    for (const error of result.errors) {
      console.error(`[startup] ${error}`);
    }
    if (process.env.NODE_ENV === "production") {
      process.exit(1);
    }
  } else {
    console.info(
      `[startup] Resume Optimizer ready (${result.environment}) — ${result.warnings.length} warning(s)`
    );
  }
}
