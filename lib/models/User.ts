import mongoose, { Schema, model, models } from "mongoose";
import { getPricingSettings } from "../app-settings";

export type UserPlan = "free" | "pro";

export interface IUser {
  clerkId: string;
  email?: string;
  plan: UserPlan;
  /** Purchased credit packs (do not reset monthly) */
  creditsBalance: number;
  /** Credits consumed from monthly allowance this month */
  creditsUsedThisMonth: number;
  /** Optimizations completed this calendar month */
  optimizationsThisMonth: number;
  /** @deprecated downloads bundled with optimization */
  downloadsThisMonth: number;
  usageMonthKey: string;
  signupBonusGranted: boolean;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  stripeSubscriptionStatus?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    clerkId: { type: String, required: true, unique: true, index: true },
    email: { type: String, default: "" },
    plan: { type: String, enum: ["free", "pro"], default: "free" },
    creditsBalance: { type: Number, default: 0 },
    creditsUsedThisMonth: { type: Number, default: 0 },
    optimizationsThisMonth: { type: Number, default: 0 },
    downloadsThisMonth: { type: Number, default: 0 },
    usageMonthKey: { type: String, default: "" },
    signupBonusGranted: { type: Boolean, default: false },
    stripeCustomerId: { type: String, default: "" },
    stripeSubscriptionId: { type: String, default: "" },
    stripeSubscriptionStatus: { type: String, default: "" },
  },
  { timestamps: true }
);

export const User = models.User || model<IUser>("User", UserSchema);

function currentMonthKey(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
}

export async function ensureUser(clerkId: string, email?: string | null): Promise<IUser> {
  const monthKey = currentMonthKey();
  let user = await User.findOne({ clerkId }).lean<IUser>();

  if (!user) {
    const settings = await getPricingSettings();
    const bonus = settings.signupBonusCredits;
    const created = await User.create({
      clerkId,
      email: email || "",
      plan: "free",
      creditsBalance: bonus,
      creditsUsedThisMonth: 0,
      optimizationsThisMonth: 0,
      downloadsThisMonth: 0,
      usageMonthKey: monthKey,
      signupBonusGranted: bonus > 0,
    });
    return created.toObject() as IUser;
  }

  if (user.usageMonthKey !== monthKey) {
    await User.updateOne(
      { clerkId },
      {
        $set: {
          usageMonthKey: monthKey,
          creditsUsedThisMonth: 0,
          optimizationsThisMonth: 0,
          downloadsThisMonth: 0,
        },
      }
    );
    user = {
      ...user,
      usageMonthKey: monthKey,
      creditsUsedThisMonth: 0,
      optimizationsThisMonth: 0,
      downloadsThisMonth: 0,
    };
  }

  if (email && user.email !== email) {
    await User.updateOne({ clerkId }, { $set: { email } });
    user = { ...user, email };
  }

  return user;
}

export async function ensureUserIndexes() {
  if (mongoose.connection.readyState === 1) {
    await User.syncIndexes();
  }
}
