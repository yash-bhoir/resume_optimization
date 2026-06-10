import { describe, expect, it } from "vitest";
import { validateFileMagicBytes, validateFilename, validateFileSize } from "@/lib/file-validation";

describe("validateFileMagicBytes", () => {
  it("accepts valid PDF magic bytes", () => {
    const buf = Buffer.from("%PDF-1.4 fake");
    expect(validateFileMagicBytes(buf, "pdf").valid).toBe(true);
  });

  it("rejects .exe renamed to .pdf", () => {
    const buf = Buffer.from("MZ fake executable");
    expect(validateFileMagicBytes(buf, "pdf").valid).toBe(false);
  });

  it("accepts valid DOCX zip header", () => {
    const buf = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x00]);
    expect(validateFileMagicBytes(buf, "docx").valid).toBe(true);
  });
});

describe("validateFilename", () => {
  it("rejects path traversal", () => {
    expect(validateFilename("../../../etc/passwd").valid).toBe(false);
  });
});

describe("validateFileSize", () => {
  it("returns 413 for oversized buffer", () => {
    const buf = Buffer.alloc(6 * 1024 * 1024);
    const result = validateFileSize(buf);
    expect(result.valid).toBe(false);
    expect(result.status).toBe(413);
  });
});
