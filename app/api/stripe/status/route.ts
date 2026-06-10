import { getStripeConfigStatus } from "@/lib/stripe";
import { jsonOk } from "@/lib/api-response";

export const dynamic = "force-dynamic";

/** Public read-only — shows whether Stripe is wired (not secret values). */
export async function GET() {
  const status = getStripeConfigStatus();
  return jsonOk({
    stripeEnabled: status.checkoutReady,
    webhookConfigured: status.webhookReady,
    fullyReady: status.ready,
    missingEnvVars: status.missing,
    webhookUrl: status.webhookUrl,
  });
}
