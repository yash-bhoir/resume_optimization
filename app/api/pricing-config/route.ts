import { getPricingSettings } from "@/lib/app-settings";
import { getStripeConfigStatus } from "@/lib/stripe";
import { jsonOk } from "@/lib/api-response";

export const dynamic = "force-dynamic";

/** Public read-only pricing config for the marketing UI */
export async function GET() {
  const settings = await getPricingSettings();
  const stripe = getStripeConfigStatus();
  return jsonOk({
    freeCreditsPerMonth: settings.freeCreditsPerMonth,
    signupBonusCredits: settings.signupBonusCredits,
    proMonthlyCreditCap: settings.proMonthlyCreditCap,
    creditPackSize: settings.creditPackSize,
    proMonthlyPriceUsd: settings.proMonthlyPriceUsd,
    creditPackPriceUsd: settings.creditPackPriceUsd,
    requireSignInToOptimize: settings.requireSignInToOptimize,
    guestScorePreviewEnabled: settings.guestScorePreviewEnabled,
    stripeEnabled: stripe.checkoutReady,
    stripeWebhookReady: stripe.webhookReady,
    stripeMissingEnvVars: stripe.missing,
  });
}
