import type { DetectedFormat } from "@/types";

/**
 * PDF cannot be edited in-place reliably. This module documents the fallback
 * strategy when users choose "Keep my layout" with a PDF upload.
 */
export function getPdfPreserveMessage(): string {
  return (
    "PDF layout preservation is not fully supported. For exact fonts and styling, " +
    "re-upload your resume as DOCX (e.g. export from Enhancv or Word). " +
    "We will optimize content using the professional template for this run."
  );
}

export function resolveEffectiveMode(
  requestedMode: "preserve" | "template",
  format: DetectedFormat
): { mode: "preserve" | "template"; note?: string } {
  if (requestedMode !== "preserve") return { mode: "template" };

  if (format === "pdf") {
    return { mode: "template", note: getPdfPreserveMessage() };
  }
  if (format === "txt" || format === "image") {
    return {
      mode: "template",
      note: "Layout preservation is not available for this file type. Using the professional template.",
    };
  }

  return { mode: requestedMode };
}
