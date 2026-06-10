import { LIMITS } from "./constants";

export function validateDocxBuffer(buffer: Buffer): { valid: boolean; error?: string; code?: string } {
  if (buffer.length < LIMITS.FILE_MIN_BYTES) {
    return { valid: false, error: "DOCX file appears empty", code: "FILE_TOO_SMALL" };
  }
  if (buffer.length > LIMITS.FILE_MAX_BYTES) {
    return { valid: false, error: "DOCX exceeds 5 MB limit", code: "FILE_TOO_LARGE" };
  }
  const isZip =
    buffer.length >= 4 &&
    buffer[0] === 0x50 &&
    buffer[1] === 0x4b &&
    buffer[2] === 0x03 &&
    buffer[3] === 0x04;
  if (!isZip) {
    return { valid: false, error: "File content does not match DOCX format", code: "INVALID_FILE_CONTENT" };
  }
  return { valid: true };
}

export function decodeBase64Payload(base64: string): Buffer | null {
  try {
    const buffer = Buffer.from(base64, "base64");
    if (buffer.length === 0) return null;
    return buffer;
  } catch {
    return null;
  }
}
