import mongoose, { Schema, model, models } from "mongoose";

export interface IStripeEvent {
  eventId: string;
  type: string;
  clerkId?: string;
  product?: string;
  processedAt: Date;
}

const StripeEventSchema = new Schema<IStripeEvent>(
  {
    eventId: { type: String, required: true, unique: true, index: true },
    type: { type: String, required: true },
    clerkId: { type: String, default: "" },
    product: { type: String, default: "" },
    processedAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

StripeEventSchema.index({ processedAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });

export const StripeEvent =
  models.StripeEvent || model<IStripeEvent>("StripeEvent", StripeEventSchema);

export async function markStripeEventProcessed(
  eventId: string,
  type: string,
  clerkId?: string,
  product?: string
): Promise<boolean> {
  try {
    await StripeEvent.create({ eventId, type, clerkId, product });
    return true;
  } catch (err) {
    if (err && typeof err === "object" && "code" in err && err.code === 11000) {
      return false;
    }
    throw err;
  }
}
