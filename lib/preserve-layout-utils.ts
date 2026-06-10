import type { DetectedFormat } from "@/types";

export function canPreserveLayout(format: DetectedFormat): boolean {
  return format === "docx" || format === "tex";
}

export function getPreserveLayoutNote(format: DetectedFormat): string | undefined {
  if (format === "pdf") {
    return "PDF layout preservation is limited. Upload DOCX for best results.";
  }
  if (format === "txt" || format === "image") {
    return "Layout preservation is not available for this format.";
  }
  return undefined;
}
