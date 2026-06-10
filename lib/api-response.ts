import { NextResponse } from "next/server";
import type { CreditStatus } from "./credits";

export function jsonError(error: string, code: string, status = 400) {
  return NextResponse.json({ error, code }, { status });
}

export function jsonOk<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function jsonValidationError(fields: Record<string, string>, status = 400) {
  const firstError = Object.values(fields)[0] || "Validation failed";
  return NextResponse.json(
    { error: firstError, code: "VALIDATION_FAILED", fields },
    { status }
  );
}

export function jsonCreditsExceeded(credits: CreditStatus) {
  return NextResponse.json(
    {
      error: "You're out of credits. Upgrade to Pro or buy a credit pack.",
      code: "CREDITS_EXCEEDED",
      action: credits.action,
      limit: credits.monthlyLimit,
      used: credits.monthlyUsed,
      remaining: credits.totalAvailable,
      packBalance: credits.packBalance,
      resetDate: credits.resetDate,
    },
    { status: 403 }
  );
}

/** @deprecated Use jsonCreditsExceeded */
export const jsonQuotaExceeded = jsonCreditsExceeded;
