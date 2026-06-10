import { connectDB } from "./mongodb";
import {
  AppSettings,
  DEFAULT_PRICING_SETTINGS,
  type IAppSettings,
  type PricingSettings,
} from "./models/AppSettings";

export type { PricingSettings };

const CACHE_TTL_MS = 30_000;

interface SettingsCache {
  data: PricingSettings;
  expiresAt: number;
}

let cache: SettingsCache | null = null;

function envFallback(): PricingSettings {
  const parse = (key: string, fallback: number) => {
    const raw = process.env[key];
    const n = raw ? parseInt(raw, 10) : fallback;
    return Number.isFinite(n) && n >= 0 ? n : fallback;
  };

  return {
    ...DEFAULT_PRICING_SETTINGS,
    freeCreditsPerMonth: parse("FREE_CREDITS_PER_MONTH", DEFAULT_PRICING_SETTINGS.freeCreditsPerMonth),
    signupBonusCredits: parse("SIGNUP_BONUS_CREDITS", DEFAULT_PRICING_SETTINGS.signupBonusCredits),
    proMonthlyCreditCap: parse("PRO_MONTHLY_CREDIT_CAP", DEFAULT_PRICING_SETTINGS.proMonthlyCreditCap),
    creditPackSize: parse("CREDIT_PACK_SIZE", DEFAULT_PRICING_SETTINGS.creditPackSize),
  };
}

function docToSettings(doc: {
  freeCreditsPerMonth: number;
  signupBonusCredits: number;
  proMonthlyCreditCap: number;
  creditPackSize: number;
  proMonthlyPriceUsd: number;
  creditPackPriceUsd: number;
  rateLimitOptimizePerHour: number;
  requireSignInToOptimize: boolean;
  guestScorePreviewEnabled: boolean;
  updatedAt?: Date;
  updatedBy?: string;
}): PricingSettings {
  return {
    freeCreditsPerMonth: doc.freeCreditsPerMonth,
    signupBonusCredits: doc.signupBonusCredits,
    proMonthlyCreditCap: doc.proMonthlyCreditCap,
    creditPackSize: doc.creditPackSize,
    proMonthlyPriceUsd: doc.proMonthlyPriceUsd,
    creditPackPriceUsd: doc.creditPackPriceUsd,
    rateLimitOptimizePerHour: doc.rateLimitOptimizePerHour,
    requireSignInToOptimize: doc.requireSignInToOptimize,
    guestScorePreviewEnabled: doc.guestScorePreviewEnabled,
    updatedAt: doc.updatedAt,
    updatedBy: doc.updatedBy,
  };
}

export function invalidateSettingsCache(): void {
  cache = null;
}

export async function getPricingSettings(): Promise<PricingSettings> {
  if (cache && Date.now() < cache.expiresAt) {
    return cache.data;
  }

  try {
    await connectDB();
    let doc = await AppSettings.findOne({ key: "global" }).lean<IAppSettings>();

    if (!doc) {
      await AppSettings.create({ key: "global", ...DEFAULT_PRICING_SETTINGS });
      doc = await AppSettings.findOne({ key: "global" }).lean<IAppSettings>();
    }

    if (doc) {
      const data = docToSettings(doc);
      cache = { data, expiresAt: Date.now() + CACHE_TTL_MS };
      return data;
    }
  } catch {
    /* fall through to env */
  }

  const fallback = envFallback();
  cache = { data: fallback, expiresAt: Date.now() + CACHE_TTL_MS };
  return fallback;
}

export async function updatePricingSettings(
  patch: Partial<PricingSettings>,
  updatedBy: string
): Promise<PricingSettings> {
  await connectDB();

  const allowedKeys = new Set(Object.keys(DEFAULT_PRICING_SETTINGS));

  const safePatch: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(patch)) {
    if (allowedKeys.has(key) && value !== undefined) {
      safePatch[key] = value;
    }
  }

  const doc = await AppSettings.findOneAndUpdate(
    { key: "global" },
    { $set: { ...safePatch, updatedBy } },
    { upsert: true, new: true }
  ).lean<IAppSettings>();

  invalidateSettingsCache();

  return docToSettings(doc!);
}
