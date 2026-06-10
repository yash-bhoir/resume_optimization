export const LIMITS = {
  FILE_MAX_BYTES: 5 * 1024 * 1024,
  FILE_MIN_BYTES: 1024,
  FILENAME_MAX: 255,
  JD_MIN_CHARS: 50,
  JD_MAX_CHARS: 20_000,
  JD_MIN_WORDS: 10,
  RESUME_MIN_CHARS: 200,
  RESUME_MAX_CHARS: 50_000,
  RATE_LIMIT_OPTIMIZE_PER_HOUR: 5,
} as const;

/** Credits included free each month (signed-in users) */
export const DEFAULT_FREE_CREDITS_PER_MONTH = 3;

/** One-time bonus on first sign-up */
export const DEFAULT_SIGNUP_BONUS_CREDITS = 1;

/** Pro fair-use cap per month (marketed as unlimited) */
export const DEFAULT_PRO_MONTHLY_CREDIT_CAP = 50;

/** Credit pack size (future Stripe one-time purchase) */
export const DEFAULT_CREDIT_PACK_SIZE = 10;

export const PRICING = {
  proMonthlyUsd: 12,
  creditPackUsd: 5,
  jobSprintMonthlyUsd: 19,
} as const;

function parsePositiveInt(raw: string | undefined, fallback: number): number {
  const parsed = raw ? parseInt(raw, 10) : fallback;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function freeCreditsPerMonth(): number {
  return parsePositiveInt(
    process.env.FREE_CREDITS_PER_MONTH,
    DEFAULT_FREE_CREDITS_PER_MONTH
  );
}

export function signupBonusCredits(): number {
  return parsePositiveInt(
    process.env.SIGNUP_BONUS_CREDITS,
    DEFAULT_SIGNUP_BONUS_CREDITS
  );
}

export function proMonthlyCreditCap(): number {
  return parsePositiveInt(
    process.env.PRO_MONTHLY_CREDIT_CAP,
    DEFAULT_PRO_MONTHLY_CREDIT_CAP
  );
}

export function creditPackSize(): number {
  return parsePositiveInt(process.env.CREDIT_PACK_SIZE, DEFAULT_CREDIT_PACK_SIZE);
}

/** @deprecated Use freeCreditsPerMonth */
export function freeOptimizationsLimit(): number {
  return freeCreditsPerMonth();
}

/** Downloads are bundled with optimization — no separate free download limit */
export function freeDownloadsLimit(): number {
  return Number.MAX_SAFE_INTEGER;
}
