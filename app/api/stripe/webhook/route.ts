import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/lib/models/User";
import { setUserPlan } from "@/lib/credits";
import { getStripe } from "@/lib/stripe";
import { fulfillCheckoutSession } from "@/lib/stripe-fulfill";
import { markStripeEventProcessed } from "@/lib/models/StripeEvent";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();

  if (!stripe || !webhookSecret) {
    return new Response("Stripe webhook not configured", { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return new Response("Missing signature", { status: 400 });
  }

  const body = await request.text();
  let event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    logger.warn({ err }, "Stripe webhook signature verification failed");
    return new Response("Invalid signature", { status: 400 });
  }

  await connectDB();

  const clerkId = (event.data.object as { metadata?: { clerkId?: string } }).metadata?.clerkId;
  const product = (event.data.object as { metadata?: { product?: string } }).metadata?.product;

  const isNew = await markStripeEventProcessed(event.id, event.type, clerkId, product);
  if (!isNew) {
    return new Response(JSON.stringify({ received: true, duplicate: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        await fulfillCheckoutSession({
          id: session.id,
          mode: session.mode,
          paymentStatus: session.payment_status,
          metadata: session.metadata,
          customer: typeof session.customer === "string" ? session.customer : null,
          subscription:
            typeof session.subscription === "string" ? session.subscription : null,
        });
        break;
      }
      case "customer.subscription.deleted":
      case "customer.subscription.updated": {
        const sub = event.data.object;
        const subClerkId = sub.metadata?.clerkId;
        if (!subClerkId) break;

        await connectDB();
        if (sub.status === "active" || sub.status === "trialing") {
          await setUserPlan(subClerkId, "pro");
          await User.updateOne(
            { clerkId: subClerkId },
            {
              $set: {
                stripeSubscriptionId: sub.id,
                stripeSubscriptionStatus: sub.status,
              },
            }
          );
        } else {
          await setUserPlan(subClerkId, "free");
          await User.updateOne(
            { clerkId: subClerkId },
            {
              $set: {
                stripeSubscriptionStatus: sub.status,
              },
            }
          );
        }
        break;
      }
      default:
        break;
    }
  } catch (err) {
    logger.error({ err, type: event.type }, "Stripe webhook handler failed");
    return new Response("Webhook handler failed", { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
