import { describe, expect, it } from "vitest";
import {
  DEFAULT_FREE_CREDITS_PER_MONTH,
  DEFAULT_PRO_MONTHLY_CREDIT_CAP,
  freeCreditsPerMonth,
  proMonthlyCreditCap,
} from "@/lib/constants";

describe("credit constants", () => {
  it("defaults to 3 free credits per month", () => {
    expect(freeCreditsPerMonth()).toBe(DEFAULT_FREE_CREDITS_PER_MONTH);
    expect(DEFAULT_FREE_CREDITS_PER_MONTH).toBe(3);
  });

  it("defaults pro fair-use cap to 50", () => {
    expect(proMonthlyCreditCap()).toBe(DEFAULT_PRO_MONTHLY_CREDIT_CAP);
    expect(DEFAULT_PRO_MONTHLY_CREDIT_CAP).toBe(50);
  });
});
