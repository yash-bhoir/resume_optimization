import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { User, ensureUser } from "@/lib/models/User";
import { getStripe, isStripeConfigured, appBaseUrl } from "@/lib/stripe";
import { getRouteContext, withRouteLogging } from "@/lib/api-route";
import { jsonError, jsonOk } from "@/lib/api-response";
import { toSafeClientMessage } from "@/lib/safe-error";

export async function POST(request: NextRequest) {
  const authResult = await requireAuth();
  if (authResult.error) return authResult.error;

  const ctx = getRouteContext(request, authResult.userId);

  return withRouteLogging(ctx, async () => {
    try {
      if (!isStripeConfigured()) {
        return jsonError("Billing portal is not available yet", "STRIPE_NOT_CONFIGURED", 503);
      }

      const stripe = getStripe();
      if (!stripe) {
        return jsonError("Stripe unavailable", "STRIPE_NOT_CONFIGURED", 503);
      }

      await connectDB();
      const user = await ensureUser(authResult.userId);

      let customerId = user.stripeCustomerId;
      if (!customerId) {
        const customer = await stripe.customers.create({
          metadata: { clerkId: authResult.userId },
          email: user.email || undefined,
        });
        customerId = customer.id;
        await User.updateOne(
          { clerkId: authResult.userId },
          { $set: { stripeCustomerId: customerId } }
        );
      }

      const portal = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: `${appBaseUrl()}/pricing`,
      });

      if (!portal.url) {
        return jsonError("Could not open billing portal", "PORTAL_FAILED", 500);
      }

      return jsonOk({ url: portal.url });
    } catch (err) {
      return jsonError(
        toSafeClientMessage(err, "Billing portal failed"),
        "PORTAL_FAILED",
        500
      );
    }
  });
}
