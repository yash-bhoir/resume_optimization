import type { DetectedFormat } from "@/types";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const MIME_MAP: Record<string, DetectedFormat> = {
  "application/pdf": "pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "text/plain": "txt",
  "image/jpeg": "image",
  "image/jpg": "image",
  "image/png": "image",
};

const EXT_MAP: Record<string, DetectedFormat> = {
  pdf: "pdf",
  docx: "docx",
  txt: "txt",
  jpg: "image",
  jpeg: "image",
  png: "image",
};

export function detectFormat(file: File): DetectedFormat {
  if (MIME_MAP[file.type]) return MIME_MAP[file.type];
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext && EXT_MAP[ext]) return EXT_MAP[ext];
  return "unknown";
}

export function validateUpload(file: File): { valid: boolean; error?: string; code?: string } {
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: "File exceeds 5MB limit", code: "FILE_TOO_LARGE" };
  }

  const format = detectFormat(file);
  if (format === "unknown") {
    return {
      valid: false,
      error: "Unsupported file type. Use PDF, DOCX, TXT, JPG, or PNG.",
      code: "UNSUPPORTED_FORMAT",
    };
  }

  return { valid: true };
}

export async function parsePdfBuffer(buffer: Buffer): Promise<string> {
  const pdfParse = (await import("pdf-parse")).default;
  const data = await pdfParse(buffer);
  return data.text?.trim() || "";
}

export async function parseDocxBuffer(buffer: Buffer): Promise<string> {
  const mammoth = await import("mammoth");
  const result = await mammoth.extractRawText({ buffer });
  return result.value?.trim() || "";
}

export async function parseTxtBuffer(buffer: Buffer): Promise<string> {
  return buffer.toString("utf-8").trim();
}

export async function parseImageBuffer(buffer: Buffer): Promise<string> {
  const Tesseract = await import("tesseract.js");
  const result = await Tesseract.recognize(buffer, "eng");
  return result.data.text?.trim() || "";
}

export async function parseResumeFile(
  buffer: Buffer,
  format: DetectedFormat
): Promise<string> {
  switch (format) {
    case "pdf":
      return parsePdfBuffer(buffer);
    case "docx":
      return parseDocxBuffer(buffer);
    case "txt":
      return parseTxtBuffer(buffer);
    case "image":
      return parseImageBuffer(buffer);
    default:
      throw new Error("Unsupported format");
  }
}
