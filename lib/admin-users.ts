import { connectDB } from "./mongodb";
import { User, type IUser, type UserPlan } from "./models/User";
import { getPricingSettings } from "./app-settings";
import { getStripeConfigStatus } from "./stripe";

export interface AdminUserRow {
  clerkId: string;
  email: string;
  plan: UserPlan;
  creditsBalance: number;
  creditsUsedThisMonth: number;
  optimizationsThisMonth: number;
  totalAvailable: number;
  monthlyLimit: number;
  usageMonthKey: string;
  signupBonusGranted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminUserListResult {
  users: AdminUserRow[];
  total: number;
  page: number;
  pageSize: number;
}

export async function listUsersForAdmin(options: {
  page?: number;
  pageSize?: number;
  search?: string;
  plan?: UserPlan | "all";
}): Promise<AdminUserListResult> {
  await connectDB();
  const settings = await getPricingSettings();

  const page = Math.max(1, options.page ?? 1);
  const pageSize = Math.min(50, Math.max(5, options.pageSize ?? 20));
  const skip = (page - 1) * pageSize;

  const filter: Record<string, unknown> = {};
  if (options.plan && options.plan !== "all") {
    filter.plan = options.plan;
  }
  if (options.search?.trim()) {
    const q = options.search.trim();
    filter.$or = [
      { email: { $regex: q, $options: "i" } },
      { clerkId: { $regex: q, $options: "i" } },
    ];
  }

  const [users, total] = await Promise.all([
    User.find(filter).sort({ updatedAt: -1 }).skip(skip).limit(pageSize).lean<IUser[]>(),
    User.countDocuments(filter),
  ]);

  const rows: AdminUserRow[] = users.map((u) => {
    const monthlyLimit =
      u.plan === "pro" ? settings.proMonthlyCreditCap : settings.freeCreditsPerMonth;
    const monthlyRemaining = Math.max(0, monthlyLimit - (u.creditsUsedThisMonth || 0));
    return {
      clerkId: u.clerkId,
      email: u.email || "",
      plan: u.plan,
      creditsBalance: u.creditsBalance || 0,
      creditsUsedThisMonth: u.creditsUsedThisMonth || 0,
      optimizationsThisMonth: u.optimizationsThisMonth || 0,
      totalAvailable: monthlyRemaining + (u.creditsBalance || 0),
      monthlyLimit,
      usageMonthKey: u.usageMonthKey || "",
      signupBonusGranted: u.signupBonusGranted ?? false,
      createdAt: u.createdAt?.toISOString?.() ?? new Date().toISOString(),
      updatedAt: u.updatedAt?.toISOString?.() ?? new Date().toISOString(),
    };
  });

  return { users: rows, total, page, pageSize };
}

export async function updateUserByAdmin(
  clerkId: string,
  patch: {
    plan?: UserPlan;
    creditsBalance?: number;
    creditsUsedThisMonth?: number;
    grantPackCredits?: number;
    resetMonthlyUsage?: boolean;
  }
): Promise<IUser | null> {
  await connectDB();

  const update: Record<string, unknown> = {};

  if (patch.plan) update.plan = patch.plan;
  if (typeof patch.creditsBalance === "number") {
    update.creditsBalance = Math.max(0, Math.floor(patch.creditsBalance));
  }
  if (typeof patch.creditsUsedThisMonth === "number") {
    update.creditsUsedThisMonth = Math.max(0, Math.floor(patch.creditsUsedThisMonth));
  }
  if (patch.resetMonthlyUsage) {
    update.creditsUsedThisMonth = 0;
    update.optimizationsThisMonth = 0;
    update.downloadsThisMonth = 0;
  }

  const inc: Record<string, number> = {};
  if (typeof patch.grantPackCredits === "number" && patch.grantPackCredits > 0) {
    inc.creditsBalance = Math.floor(patch.grantPackCredits);
  }

  if (Object.keys(update).length === 0 && Object.keys(inc).length === 0) {
    return null;
  }

  const mongoUpdate: Record<string, unknown> = {};
  if (Object.keys(update).length) mongoUpdate.$set = update;
  if (Object.keys(inc).length) mongoUpdate.$inc = inc;

  const result = await User.findOneAndUpdate({ clerkId }, mongoUpdate, { new: true }).lean<IUser>();

  return result;
}

export async function getAdminDashboardStats() {
  await connectDB();
  const settings = await getPricingSettings();

  const [totalUsers, proUsers, agg] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ plan: "pro" }),
    User.aggregate<{ totalOpts: number; totalPack: number }>([
      {
        $group: {
          _id: null,
          totalOpts: { $sum: "$optimizationsThisMonth" },
          totalPack: { $sum: "$creditsBalance" },
        },
      },
    ]),
  ]);

  const totals = agg[0] ?? { totalOpts: 0, totalPack: 0 };

  const stripe = getStripeConfigStatus();

  return {
    totalUsers,
    proUsers,
    freeUsers: totalUsers - proUsers,
    optimizationsThisMonth: totals.totalOpts,
    packCreditsOutstanding: totals.totalPack,
    pricing: settings,
    payments: {
      stripeEnabled: stripe.checkoutReady,
      webhookReady: stripe.webhookReady,
      missingEnvVars: stripe.missing,
      webhookUrl: stripe.webhookUrl,
    },
  };
}
