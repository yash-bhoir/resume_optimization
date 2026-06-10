import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getCreditStatus } from "@/lib/credits";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { fulfillCheckoutSession } from "@/lib/stripe-fulfill";
import { getRouteContext, withRouteLogging } from "@/lib/api-route";
import { jsonError, jsonOk } from "@/lib/api-response";
import { toSafeClientMessage } from "@/lib/safe-error";

export async function GET(request: NextRequest) {
  const authResult = await requireAuth();
  if (authResult.error) return authResult.error;

  const sessionId = request.nextUrl.searchParams.get("session_id");
  if (!sessionId) {
    return jsonError("session_id is required", "INVALID_SESSION", 400);
  }

  const ctx = getRouteContext(request, authResult.userId);

  return withRouteLogging(ctx, async () => {
    try {
      const credits = await getCreditStatus(authResult.userId);

      if (!isStripeConfigured()) {
        return jsonOk({
          verified: false,
          plan: credits.plan,
          credits: credits,
          message: "Stripe not configured — payment recorded when webhook runs",
        });
      }

      const stripe = getStripe();
      if (!stripe) {
        return jsonError("Stripe unavailable", "STRIPE_NOT_CONFIGURED", 503);
      }

      const session = await stripe.checkout.sessions.retrieve(sessionId);

      if (session.metadata?.clerkId && session.metadata.clerkId !== authResult.userId) {
        return jsonError("Session does not belong to this account", "FORBIDDEN", 403);
      }

      const result = await fulfillCheckoutSession({
        id: session.id,
        mode: session.mode,
        paymentStatus: session.payment_status,
        metadata: session.metadata,
        customer: typeof session.customer === "string" ? session.customer : null,
        subscription:
          typeof session.subscription === "string" ? session.subscription : null,
      });

      const updatedCredits = await getCreditStatus(authResult.userId);

      return jsonOk({
        verified: result.fulfilled,
        product: result.product || session.metadata?.product,
        plan: updatedCredits.plan,
        credits: {
          monthlyLimit: updatedCredits.monthlyLimit,
          monthlyUsed: updatedCredits.monthlyUsed,
          monthlyRemaining: updatedCredits.monthlyRemaining,
          packBalance: updatedCredits.packBalance,
          totalAvailable: updatedCredits.totalAvailable,
        },
        paymentStatus: session.payment_status,
      });
    } catch (err) {
      return jsonError(
        toSafeClientMessage(err, "Could not verify payment"),
        "VERIFY_FAILED",
        500
      );
    }
  });
}
