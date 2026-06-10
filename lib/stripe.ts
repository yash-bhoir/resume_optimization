import Stripe from "stripe";

let stripeClient: Stripe | null = null;

const STRIPE_ENV_KEYS = [
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "STRIPE_PRO_PRICE_ID",
  "STRIPE_CREDIT_PACK_PRICE_ID",
] as const;

export type StripeEnvKey = (typeof STRIPE_ENV_KEYS)[number];

export interface StripeConfigStatus {
  ready: boolean;
  checkoutReady: boolean;
  webhookReady: boolean;
  missing: StripeEnvKey[];
  webhookUrl: string;
}

export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) return null;
  if (!stripeClient) {
    stripeClient = new Stripe(key, { apiVersion: "2026-05-27.dahlia" });
  }
  return stripeClient;
}

export function isStripeConfigured(): boolean {
  return getStripeConfigStatus().checkoutReady;
}

export function isStripeWebhookConfigured(): boolean {
  return getStripeConfigStatus().webhookReady;
}

export function getStripeConfigStatus(): StripeConfigStatus {
  const missing = STRIPE_ENV_KEYS.filter((key) => !process.env[key]?.trim());
  const checkoutReady =
    !missing.includes("STRIPE_SECRET_KEY") &&
    !missing.includes("STRIPE_PRO_PRICE_ID") &&
    !missing.includes("STRIPE_CREDIT_PACK_PRICE_ID");
  const webhookReady = checkoutReady && !missing.includes("STRIPE_WEBHOOK_SECRET");

  return {
    ready: webhookReady,
    checkoutReady,
    webhookReady,
    missing: [...missing],
    webhookUrl: `${appBaseUrl()}/api/stripe/webhook`,
  };
}

export function appBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_APP_URL?.trim() || "http://localhost:3000";
  return url.replace(/\/$/, "");
}