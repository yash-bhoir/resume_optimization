import { connectDB } from "./mongodb";
import { User } from "./models/User";
import { addPackCredits, setUserPlan } from "./credits";
import { getPricingSettings } from "./app-settings";
import { logger } from "./logger";

export interface CheckoutSessionPayload {
  id: string;
  mode: string;
  paymentStatus: string;
  metadata: Record<string, string> | null;
  customer: string | null;
  subscription: string | null;
}

export async function fulfillCheckoutSession(session: CheckoutSessionPayload): Promise<{
  fulfilled: boolean;
  product?: string;
  clerkId?: string;
}> {
  const clerkId = session.metadata?.clerkId;
  const product = session.metadata?.product;

  if (!clerkId || !product) {
    return { fulfilled: false };
  }

  if (session.paymentStatus !== "paid" && session.paymentStatus !== "no_payment_required") {
    return { fulfilled: false, clerkId, product };
  }

  await connectDB();

  if (session.customer) {
    await User.updateOne({ clerkId }, { $set: { stripeCustomerId: session.customer } });
  }

  if (product === "pro" && session.mode === "subscription") {
    await setUserPlan(clerkId, "pro");
    if (session.subscription) {
      await User.updateOne(
        { clerkId },
        {
          $set: {
            stripeSubscriptionId: session.subscription,
            stripeSubscriptionStatus: "active",
          },
        }
      );
    }
    logger.info({ clerkId }, "Pro subscription activated");
    return { fulfilled: true, product, clerkId };
  }

  if (product === "credit_pack" && session.mode === "payment") {
    const settings = await getPricingSettings();
    await addPackCredits(clerkId, settings.creditPackSize);
    logger.info({ clerkId, credits: settings.creditPackSize }, "Credit pack fulfilled");
    return { fulfilled: true, product, clerkId };
  }

  return { fulfilled: false, clerkId, product };
}
