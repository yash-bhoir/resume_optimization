import { writeFile, unlink } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import Tesseract from "tesseract.js";
import { withBrowserPage } from "./puppeteer-pool";
import { logger } from "./logger";

const OCR_MIN_CHARS = 120;

export function shouldAttemptOcr(extractedText: string, pageCount?: number): boolean {
  const len = extractedText.trim().length;
  if (len < OCR_MIN_CHARS) return true;
  if (pageCount && pageCount > 0 && len / pageCount < 80) return true;
  return false;
}

export async function ocrImageBuffer(buffer: Buffer): Promise<string> {
  const {
    data: { text },
  } = await Tesseract.recognize(buffer, "eng", {
    logger: () => {},
  });
  return text?.trim() || "";
}

export async function ocrPdfBuffer(buffer: Buffer): Promise<string> {
  const tmpPath = join(tmpdir(), `resume-ocr-${Date.now()}-${Math.random().toString(36).slice(2)}.pdf`);
  await writeFile(tmpPath, buffer);

  try {
    const fileUrl = `file:///${tmpPath.replace(/\\/g, "/")}`;
    const screenshot = await withBrowserPage(async (page) => {
      await page.setViewport({ width: 850, height: 1100, deviceScaleFactor: 2 });
      await page.goto(fileUrl, { waitUntil: "networkidle0", timeout: 45_000 });
      await new Promise((r) => setTimeout(r, 800));
      return page.screenshot({ fullPage: true, type: "png" });
    });

    const pngBuffer = Buffer.isBuffer(screenshot) ? screenshot : Buffer.from(screenshot);
    return ocrImageBuffer(pngBuffer);
  } catch (err) {
    logger.warn({ err }, "PDF OCR failed");
    throw new Error(
      "Could not read this scanned PDF. Try exporting a text-based PDF or upload DOCX instead."
    );
  } finally {
    await unlink(tmpPath).catch(() => {});
  }
}

export async function ocrResumeBuffer(buffer: Buffer, format: "pdf" | "image"): Promise<string> {
  if (format === "image") return ocrImageBuffer(buffer);
  return ocrPdfBuffer(buffer);
}
