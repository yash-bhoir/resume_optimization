import type { DetectedFormat } from "@/types";
import type { ParseResumeResult } from "@/types/resume-document";
import { parseTextToDocument } from "./resume-schema";
import { LIMITS } from "./constants";
import {
  isLikelyScannedPdf,
  isPasswordProtectedPdfError,
  validateFilename,
  validateFileSize,
} from "./file-validation";
import { shouldAttemptOcr, ocrResumeBuffer } from "./resume-ocr";

const MIME_MAP: Record<string, DetectedFormat> = {
  "application/pdf": "pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "image/jpeg": "image",
  "image/jpg": "image",
  "image/png": "image",
  "image/webp": "image",
};

const EXT_MAP: Record<string, DetectedFormat> = {
  pdf: "pdf",
  docx: "docx",
  jpg: "image",
  jpeg: "image",
  png: "image",
  webp: "image",
};

export function detectFormat(file: File): DetectedFormat {
  if (MIME_MAP[file.type]) return MIME_MAP[file.type];
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext && EXT_MAP[ext]) return EXT_MAP[ext];
  return "unknown";
}

export function validateUpload(file: File): {
  valid: boolean;
  error?: string;
  code?: string;
  status?: number;
} {
  const nameCheck = validateFilename(file.name);
  if (!nameCheck.valid) {
    return { valid: false, error: nameCheck.error, code: nameCheck.code };
  }

  const format = detectFormat(file);
  if (format === "unknown") {
    return {
      valid: false,
      error: "Only PDF, DOCX, or image files (JPG/PNG) are supported.",
      code: "UNSUPPORTED_FORMAT",
    };
  }

  if (file.size < LIMITS.FILE_MIN_BYTES) {
    return {
      valid: false,
      error: "File appears empty. Upload a resume that is at least 1 KB.",
      code: "FILE_TOO_SMALL",
      status: 400,
    };
  }

  if (file.size > LIMITS.FILE_MAX_BYTES) {
    return {
      valid: false,
      error: "File exceeds 5 MB limit",
      code: "FILE_TOO_LARGE",
      status: 413,
    };
  }

  return { valid: true };
}

export async function parsePdfBuffer(buffer: Buffer): Promise<{ text: string; pageCount?: number }> {
  const pdfParse = (await import("pdf-parse")).default;
  try {
    const data = await pdfParse(buffer);
    return { text: data.text?.trim() || "", pageCount: data.numpages };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (isPasswordProtectedPdfError(message)) {
      throw new Error("This PDF is password-protected. Remove the password and try again.");
    }
    throw err;
  }
}

export async function parseDocxBuffer(buffer: Buffer): Promise<string> {
  const mammoth = await import("mammoth");
  const result = await mammoth.extractRawText({ buffer });
  return result.value?.trim() || "";
}

export async function parseResumeFile(
  buffer: Buffer,
  format: DetectedFormat
): Promise<{ text: string; pageCount?: number; scannedWarning?: string; usedOcr?: boolean }> {
  switch (format) {
    case "pdf": {
      const parsed = await parsePdfBuffer(buffer);
      const needsOcr =
        isLikelyScannedPdf(parsed.text, parsed.pageCount) ||
        shouldAttemptOcr(parsed.text, parsed.pageCount);

      if (needsOcr) {
        try {
          const ocrText = await ocrResumeBuffer(buffer, "pdf");
          if (ocrText.length >= LIMITS.RESUME_MIN_CHARS) {
            return {
              text: ocrText,
              pageCount: parsed.pageCount,
              scannedWarning:
                "We used OCR to read this scanned PDF. Review the extracted text before optimizing.",
              usedOcr: true,
            };
          }
        } catch {
          /* fall through to warning */
        }
        if (isLikelyScannedPdf(parsed.text, parsed.pageCount)) {
          return {
            ...parsed,
            scannedWarning:
              "This looks like a scanned PDF. OCR could not extract enough text — try DOCX or a text-based PDF.",
          };
        }
      }
      return parsed;
    }
    case "image": {
      const ocrText = await ocrResumeBuffer(buffer, "image");
      return {
        text: ocrText,
        scannedWarning: ocrText.length >= LIMITS.RESUME_MIN_CHARS
          ? "Text extracted via OCR from your image. Review before optimizing."
          : undefined,
        usedOcr: true,
      };
    }
    case "docx":
      return { text: await parseDocxBuffer(buffer) };
    default:
      throw new Error("Unsupported format");
  }
}

export function getPreserveLayoutSupport(format: DetectedFormat): {
  supported: boolean;
  note?: string;
} {
  switch (format) {
    case "docx":
      return { supported: true };
    case "pdf":
      return {
        supported: false,
        note: "Layout preservation requires Pro and a DOCX upload.",
      };
    default:
      return { supported: false };
  }
}

export async function parseResumeStructured(
  buffer: Buffer,
  format: DetectedFormat
): Promise<ParseResumeResult> {
  const parsed = await parseResumeFile(buffer, format);
  const rawText = parsed.text;

  if (!rawText || rawText.length < LIMITS.RESUME_MIN_CHARS) {
    throw new Error(
      "Could not extract enough text from your resume. If it's a scanned PDF, try uploading a text-based version or DOCX."
    );
  }

  const resumeDocument = parseTextToDocument(rawText, false);
  const preserve = getPreserveLayoutSupport(format);

  const result: ParseResumeResult = {
    rawText: rawText.slice(0, LIMITS.RESUME_MAX_CHARS),
    resumeDocument,
    detectedFormat: format,
    preserveLayoutSupported: preserve.supported,
    preserveLayoutNote: preserve.note,
    scannedWarning: parsed.scannedWarning,
  };

  if (format === "pdf" || format === "docx") {
    result.originalFileBase64 = buffer.toString("base64");
  }
  if (format === "image") {
    result.originalFileBase64 = buffer.toString("base64");
  }

  return result;
}

