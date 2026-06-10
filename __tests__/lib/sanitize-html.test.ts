import { describe, expect, it } from "vitest";
import { sanitizeHtml, sanitizeUrl } from "@/lib/sanitize-html";

describe("sanitizeUrl", () => {
  it("blocks javascript: URLs", () => {
    expect(sanitizeUrl("javascript:alert(1)")).toBe("#");
  });

  it("allows https URLs", () => {
    expect(sanitizeUrl("https://example.com")).toBe("https://example.com");
  });
});

describe("sanitizeHtml", () => {
  it("strips script tags", () => {
    const out = sanitizeHtml('<p>ok</p><script>alert(1)</script>');
    expect(out).not.toContain("<script");
    expect(out).toContain("ok");
  });
});
