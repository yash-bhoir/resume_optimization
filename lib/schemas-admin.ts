import { z } from "zod";

export const adminUserPatchSchema = z
  .object({
    plan: z.enum(["free", "pro"]).optional(),
    creditsBalance: z.number().int().min(0).max(10_000).optional(),
    creditsUsedThisMonth: z.number().int().min(0).max(10_000).optional(),
    grantPackCredits: z.number().int().min(1).max(500).optional(),
    resetMonthlyUsage: z.boolean().optional(),
  })
  .refine(
    (data) =>
      data.plan !== undefined ||
      data.creditsBalance !== undefined ||
      data.creditsUsedThisMonth !== undefined ||
      data.grantPackCredits !== undefined ||
      data.resetMonthlyUsage === true,
    { message: "At least one field must be updated" }
  );

export const adminSettingsPatchSchema = z.object({
  freeCreditsPerMonth: z.number().int().min(0).max(100).optional(),
  signupBonusCredits: z.number().int().min(0).max(50).optional(),
  proMonthlyCreditCap: z.number().int().min(1).max(500).optional(),
  creditPackSize: z.number().int().min(1).max(200).optional(),
  proMonthlyPriceUsd: z.number().min(0).max(999).optional(),
  creditPackPriceUsd: z.number().min(0).max(999).optional(),
  rateLimitOptimizePerHour: z.number().int().min(1).max(100).optional(),
  requireSignInToOptimize: z.boolean().optional(),
  guestScorePreviewEnabled: z.boolean().optional(),
});
