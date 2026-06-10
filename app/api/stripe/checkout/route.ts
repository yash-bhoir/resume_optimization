import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { User, ensureUser } from "@/lib/models/User";
import { getStripe, isStripeConfigured, appBaseUrl } from "@/lib/stripe";
import { getRouteContext, withRouteLogging } from "@/lib/api-route";
import { requireJsonContentType } from "@/lib/request-guards";
import { jsonError, jsonOk } from "@/lib/api-response";
import { toSafeClientMessage } from "@/lib/safe-error";
import { z } from "zod";

const checkoutSchema = z.object({
  product: z.enum(["pro", "credit_pack"]),
});

export async function POST(request: NextRequest) {
  const authResult = await requireAuth();
  if (authResult.error) return authResult.error;

  const ctx = getRouteContext(request, authResult.userId);

  return withRouteLogging(ctx, async () => {
    try {
      if (!isStripeConfigured()) {
        return jsonError(
          "Payments are not configured yet. Contact support or use admin upgrade.",
          "STRIPE_NOT_CONFIGURED",
          503
        );
      }

      const contentTypeError = requireJsonContentType(request);
      if (contentTypeError) return contentTypeError;

      const body = await request.json();
      const parsed = checkoutSchema.safeParse(body);
      if (!parsed.success) {
        return jsonError("Invalid product", "INVALID_PRODUCT", 400);
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

      const base = appBaseUrl();
      const isPro = parsed.data.product === "pro";
      const priceId = isPro
        ? process.env.STRIPE_PRO_PRICE_ID!
        : process.env.STRIPE_CREDIT_PACK_PRICE_ID!;

      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: isPro ? "subscription" : "payment",
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${base}/pricing/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${base}/pricing?canceled=1`,
        metadata: {
          clerkId: authResult.userId,
          product: parsed.data.product,
        },
        subscription_data: isPro
          ? { metadata: { clerkId: authResult.userId, product: "pro" } }
          : undefined,
      });

      if (!session.url) {
        return jsonError("Could not start checkout", "CHECKOUT_FAILED", 500);
      }

      return jsonOk({ url: session.url });
    } catch (err) {
      return jsonError(
        toSafeClientMessage(err, "Checkout failed"),
        "CHECKOUT_FAILED",
        500
      );
    }
  });
}
