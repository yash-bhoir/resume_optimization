import { connectDB } from "./mongodb";
import { User, ensureUser, type IUser, type UserPlan } from "./models/User";
import { getPricingSettings } from "./app-settings";

export type CreditAction = "optimize";

export type CreditDeductionSource = "monthly" | "pack";

export interface CreditStatus {
  allowed: boolean;
  plan: UserPlan;
  action: CreditAction;
  /** Monthly allowance (null = pro fair-use cap shown separately) */
  monthlyLimit: number | null;
  monthlyUsed: number;
  monthlyRemaining: number | null;
  packBalance: number;
  totalAvailable: number;
  resetDate: string;
  /** For API compatibility */
  limit: number | null;
  used: number;
  remaining: number | null;
}

function nextMonthResetDate(): string {
  const now = new Date();
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  return next.toISOString();
}

function currentMonthKey(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
}

async function monthlyAllowance(plan: UserPlan): Promise<number> {
  const settings = await getPricingSettings();
  return plan === "pro" ? settings.proMonthlyCreditCap : settings.freeCreditsPerMonth;
}

async function computeTotalAvailable(user: IUser): Promise<number> {
  const allowance = await monthlyAllowance(user.plan);
  const monthlyRemaining = Math.max(0, allowance - user.creditsUsedThisMonth);
  return monthlyRemaining + (user.creditsBalance || 0);
}

async function toCreditStatus(user: IUser, action: CreditAction = "optimize"): Promise<CreditStatus> {
  const allowance = await monthlyAllowance(user.plan);
  const monthlyUsed = user.creditsUsedThisMonth;
  const monthlyRemaining = Math.max(0, allowance - monthlyUsed);
  const packBalance = user.creditsBalance || 0;
  const totalAvailable = monthlyRemaining + packBalance;

  return {
    allowed: totalAvailable > 0,
    plan: user.plan,
    action,
    monthlyLimit: allowance,
    monthlyUsed,
    monthlyRemaining,
    packBalance,
    totalAvailable,
    resetDate: nextMonthResetDate(),
    limit: allowance,
    used: monthlyUsed,
    remaining: totalAvailable,
  };
}

async function ensureCurrentMonth(userId: string): Promise<IUser> {
  const monthKey = currentMonthKey();
  const user = await ensureUser(userId);
  if (user.usageMonthKey === monthKey) return user;

  await User.updateOne(
    { clerkId: userId },
    {
      $set: {
        usageMonthKey: monthKey,
        creditsUsedThisMonth: 0,
        optimizationsThisMonth: 0,
        downloadsThisMonth: 0,
      },
    }
  );

  return {
    ...user,
    usageMonthKey: monthKey,
    creditsUsedThisMonth: 0,
    optimizationsThisMonth: 0,
    downloadsThisMonth: 0,
  };
}

export async function getCreditStatus(
  userId: string,
  action: CreditAction = "optimize"
): Promise<CreditStatus> {
  await connectDB();
  const user = await ensureCurrentMonth(userId);
  return await toCreditStatus(user, action);
}

export interface ReservedCredit extends CreditStatus {
  deductionSource: CreditDeductionSource;
}

/**
 * Atomically spend 1 credit (monthly pool first, then pack balance).
 */
export async function reserveCredit(userId: string): Promise<ReservedCredit | null> {
  await connectDB();
  const monthKey = currentMonthKey();
  await ensureCurrentMonth(userId);

  const user = await User.findOne({ clerkId: userId }).lean<IUser>();
  if (!user) return null;

  const allowance = await monthlyAllowance(user.plan);

  const fromMonthly = await User.findOneAndUpdate(
    {
      clerkId: userId,
      usageMonthKey: monthKey,
      creditsUsedThisMonth: { $lt: allowance },
    },
    {
      $inc: { creditsUsedThisMonth: 1, optimizationsThisMonth: 1 },
    },
    { new: true }
  ).lean<IUser>();

  if (fromMonthly) {
    return {
      ...(await toCreditStatus(fromMonthly)),
      deductionSource: "monthly",
    };
  }

  const fromPack = await User.findOneAndUpdate(
    {
      clerkId: userId,
      creditsBalance: { $gte: 1 },
    },
    {
      $inc: { creditsBalance: -1, optimizationsThisMonth: 1 },
    },
    { new: true }
  ).lean<IUser>();

  if (fromPack) {
    return {
      ...(await toCreditStatus(fromPack)),
      deductionSource: "pack",
    };
  }

  return null;
}

export async function releaseCredit(
  userId: string,
  source: CreditDeductionSource
): Promise<void> {
  await connectDB();
  if (source === "monthly") {
    await User.updateOne(
      { clerkId: userId, creditsUsedThisMonth: { $gt: 0 } },
      { $inc: { creditsUsedThisMonth: -1, optimizationsThisMonth: -1 } }
    );
  } else {
    await User.updateOne(
      { clerkId: userId },
      { $inc: { creditsBalance: 1, optimizationsThisMonth: -1 } }
    );
  }
}

export async function addPackCredits(userId: string, amount: number): Promise<void> {
  await connectDB();
  await User.updateOne({ clerkId: userId }, { $inc: { creditsBalance: amount } });
}

export async function setUserPlan(userId: string, plan: UserPlan): Promise<void> {
  await connectDB();
  await User.updateOne({ clerkId: userId }, { $set: { plan } });
}

export async function getUserPlan(userId: string): Promise<UserPlan> {
  await connectDB();
  const user = await ensureUser(userId);
  return user.plan;
}

/** Downloads are included — signed-in users may export without spending credits */
export async function canDownload(userId: string): Promise<boolean> {
  await connectDB();
  const user = await ensureUser(userId);
  return Boolean(user);
}

// Backward-compatible aliases for gradual migration
export type QuotaStatus = CreditStatus;
export type QuotaAction = CreditAction;
export const checkQuota = getCreditStatus;
export const reserveQuota = reserveCredit;
export const releaseQuota = releaseCredit;
