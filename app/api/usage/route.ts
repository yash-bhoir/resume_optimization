import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getCreditStatus } from "@/lib/credits";
import { getPricingSettings } from "@/lib/app-settings";
import { ensureUser } from "@/lib/models/User";
import { connectDB } from "@/lib/mongodb";
import { isStripeConfigured } from "@/lib/stripe";
import { jsonError, jsonOk } from "@/lib/api-response";
import { getRouteContext, withRouteLogging } from "@/lib/api-route";
import { toSafeClientMessage } from "@/lib/safe-error";

export async function GET(request: NextRequest) {
  const authResult = await requireAuth();
  if (authResult.error) return authResult.error;

  const ctx = getRouteContext(request, authResult.userId);

  return withRouteLogging(ctx, async () => {
    try {
      await connectDB();
      const [credits, policy, user] = await Promise.all([
        getCreditStatus(authResult.userId),
        getPricingSettings(),
        ensureUser(authResult.userId),
      ]);

      const stripeEnabled = isStripeConfigured();

      return jsonOk({
        plan: credits.plan,
        billing: {
          stripeEnabled,
          canManageBilling: stripeEnabled && Boolean(user.stripeCustomerId),
          subscriptionStatus: user.stripeSubscriptionStatus || null,
        },
        credits: {
          monthlyLimit: credits.monthlyLimit,
          monthlyUsed: credits.monthlyUsed,
          monthlyRemaining: credits.monthlyRemaining,
          packBalance: credits.packBalance,
          totalAvailable: credits.totalAvailable,
        },
        resetDate: credits.resetDate,
        policy: {
          freeMonthlyCredits: policy.freeCreditsPerMonth,
          signupBonusCredits: policy.signupBonusCredits,
          proFairUseCap: policy.proMonthlyCreditCap,
          downloadsIncluded: true,
        },
        // Legacy shape for older UI
        optimizations: {
          used: credits.monthlyUsed,
          limit: credits.monthlyLimit,
          remaining: credits.totalAvailable,
        },
        downloads: {
          used: 0,
          limit: null,
          remaining: null,
        },
      });
    } catch (err) {
      return jsonError(
        toSafeClientMessage(err, "Failed to load usage"),
        "USAGE_FAILED",
        500
      );
    }
  });
}
