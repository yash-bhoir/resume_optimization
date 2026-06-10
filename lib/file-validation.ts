import type { DetectedFormat } from "@/types";
import { LIMITS } from "./constants";

export function validateFileMagicBytes(
  buffer: Buffer,
  claimedFormat: DetectedFormat
): { valid: boolean; error?: string; code?: string } {
  if (claimedFormat === "unknown") {
    return { valid: false, error: "Unsupported file type", code: "UNSUPPORTED_FORMAT" };
  }

  if (claimedFormat === "pdf") {
    const isPdf = buffer.length >= 4 && buffer.subarray(0, 4).toString() === "%PDF";
    if (!isPdf) {
      return {
        valid: false,
        error: "File content does not match PDF format",
        code: "INVALID_FILE_CONTENT",
      };
    }
  }

  if (claimedFormat === "docx") {
    const isZip =
      buffer.length >= 4 &&
      buffer[0] === 0x50 &&
      buffer[1] === 0x4b &&
      buffer[2] === 0x03 &&
      buffer[3] === 0x04;
    if (!isZip) {
      return {
        valid: false,
        error: "File content does not match DOCX format",
        code: "INVALID_FILE_CONTENT",
      };
    }
  }

  if (claimedFormat === "image") {
    const isJpeg = buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8;
    const isPng =
      buffer.length >= 8 &&
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47;
    const isWebp =
      buffer.length >= 12 &&
      buffer.subarray(0, 4).toString() === "RIFF" &&
      buffer.subarray(8, 12).toString() === "WEBP";
    if (!isJpeg && !isPng && !isWebp) {
      return {
        valid: false,
        error: "File content does not match JPG, PNG, or WebP image format",
        code: "INVALID_FILE_CONTENT",
      };
    }
  }

  return { valid: true };
}

export function validateFileSize(buffer: Buffer): { valid: boolean; error?: string; code?: string; status?: number } {
  if (buffer.length < LIMITS.FILE_MIN_BYTES) {
    return {
      valid: false,
      error: "File appears empty. Upload a resume that is at least 1 KB.",
      code: "FILE_TOO_SMALL",
      status: 400,
    };
  }

  if (buffer.length > LIMITS.FILE_MAX_BYTES) {
    return {
      valid: false,
      error: "File exceeds 5 MB limit",
      code: "FILE_TOO_LARGE",
      status: 413,
    };
  }

  return { valid: true };
}

export function validateFilename(name: string): { valid: boolean; error?: string; code?: string } {
  if (name.length > LIMITS.FILENAME_MAX) {
    return {
      valid: false,
      error: "Filename is too long (max 255 characters)",
      code: "FILENAME_TOO_LONG",
    };
  }
  const base = name.split(/[/\\]/).pop() || name;
  if (base !== name || name.includes("..")) {
    return {
      valid: false,
      error: "Invalid filename",
      code: "INVALID_FILENAME",
    };
  }
  return { valid: true };
}

export function isLikelyScannedPdf(text: string, pageCount?: number): boolean {
  const trimmed = text.trim();
  if (trimmed.length >= LIMITS.RESUME_MIN_CHARS) return false;
  if (pageCount && pageCount > 0 && trimmed.length < 50) return true;
  return trimmed.length > 0 && trimmed.length < LIMITS.RESUME_MIN_CHARS;
}

export function isPasswordProtectedPdfError(message: string): boolean {
  const lower = message.toLowerCase();
  return lower.includes("password") || lower.includes("encrypted");
}
