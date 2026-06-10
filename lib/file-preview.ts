import type { DetectedFormat } from "@/types";

export const FORMAT_MIME: Record<DetectedFormat, string> = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  txt: "text/plain",
  tex: "application/x-tex",
  image: "image/jpeg",
  unknown: "application/octet-stream",
};

export function mimeForFormat(format: DetectedFormat, fileName?: string): string {
  if (fileName) {
    const ext = fileName.split(".").pop()?.toLowerCase();
    if (ext === "png") return "image/png";
    if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
    if (ext === "pdf") return "application/pdf";
    if (ext === "docx") return FORMAT_MIME.docx;
  }
  return FORMAT_MIME[format] || FORMAT_MIME.unknown;
}

export function base64ToDataUrl(base64: string, mime: string): string {
  return `data:${mime};base64,${base64}`;
}

export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

export function base64ToBlob(base64: string, mime: string): Blob {
  return new Blob([base64ToArrayBuffer(base64)], { type: mime });
}

export function inferFormatFromFileName(fileName?: string): DetectedFormat | null {
  if (!fileName) return null;
  const ext = fileName.split(".").pop()?.toLowerCase();
  if (ext === "pdf") return "pdf";
  if (ext === "docx") return "docx";
  if (ext === "txt") return "txt";
  if (ext === "tex") return "tex";
  if (ext === "png" || ext === "jpg" || ext === "jpeg") return "image";
  return null;
}

export function canEmbedOriginal(format: DetectedFormat, hasBase64: boolean): boolean {
  if (!hasBase64 && format !== "tex") return false;
  return ["pdf", "docx", "image", "txt", "tex"].includes(format);
}
