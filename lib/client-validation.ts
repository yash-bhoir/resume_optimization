import { LIMITS } from "./constants";
import type { DetectedFormat } from "@/types";

export interface FileValidationResult {
  valid: boolean;
  error?: string;
  format?: DetectedFormat;
}

const ALLOWED_MIMES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

export function detectUploadFormat(file: File): DetectedFormat {
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (file.type === "application/pdf" || ext === "pdf") return "pdf";
  if (file.type.includes("wordprocessingml") || ext === "docx") return "docx";
  if (
    file.type.startsWith("image/") ||
    ext === "jpg" ||
    ext === "jpeg" ||
    ext === "png" ||
    ext === "webp"
  ) {
    return "image";
  }
  return "unknown";
}

export function validateFileClient(file: File): FileValidationResult {
  if (file.name.length > LIMITS.FILENAME_MAX) {
    return {
      valid: false,
      error: "Filename is too long. Rename your file to 255 characters or fewer.",
    };
  }

  const format = detectUploadFormat(file);

  if (format === "unknown") {
    return {
      valid: false,
      error: "Upload PDF, DOCX, or a resume photo (JPG/PNG).",
    };
  }

  const mimeOk =
    !file.type ||
    ALLOWED_MIMES.has(file.type) ||
    (format === "image" && file.type.startsWith("image/"));
  if (!mimeOk) {
    return {
      valid: false,
      error: "Upload PDF, DOCX, or a resume photo (JPG/PNG).",
    };
  }

  if (file.size < LIMITS.FILE_MIN_BYTES) {
    return {
      valid: false,
      error: "This file appears empty. Choose a resume that is at least 1 KB.",
    };
  }

  if (file.size > LIMITS.FILE_MAX_BYTES) {
    return {
      valid: false,
      error: "File is too large. Maximum size is 5 MB.",
    };
  }

  return { valid: true, format };
}

export function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function validateJobDescriptionClient(value: string): { valid: boolean; error?: string } {
  const trimmed = value.trim();

  if (!trimmed) {
    return { valid: false, error: "Paste the job description before continuing." };
  }

  if (trimmed.length < LIMITS.JD_MIN_CHARS) {
    return {
      valid: false,
      error: "Please paste the full job description (at least 50 characters).",
    };
  }

  if (trimmed.length > LIMITS.JD_MAX_CHARS) {
    return {
      valid: false,
      error: "Job description too long — please trim to 20,000 characters.",
    };
  }

  if (wordCount(trimmed) < LIMITS.JD_MIN_WORDS) {
    return {
      valid: false,
      error: "Job description must contain at least 10 words.",
    };
  }

  if (!/[a-zA-Z0-9]/.test(trimmed)) {
    return {
      valid: false,
      error: "Job description must contain readable text.",
    };
  }

  if (/<script[\s>]/i.test(trimmed)) {
    return { valid: false, error: "Job description contains invalid content." };
  }

  return { valid: true };
}
