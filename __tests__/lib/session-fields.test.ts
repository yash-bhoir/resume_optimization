import { describe, expect, it } from "vitest";
import { parseSessionData } from "@/lib/session-fields";

describe("parseSessionData", () => {
  it("rejects unknown fields (strict schema)", () => {
    const result = parseSessionData({ clerkId: "hacked", admin: true });
    expect(result.success).toBe(false);
  });

  it("accepts allowlisted fields", () => {
    const result = parseSessionData({
      rawText: "resume text",
      matchScore: 80,
    });
    expect(result.success).toBe(true);
  });
});
