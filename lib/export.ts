import puppeteer from "puppeteer";
import { buildExportHtml, htmlToPlainText, latexToHtml } from "./latex-to-html";
import { getPuppeteerLaunchOptions } from "./puppeteer-browser";

export async function exportToPdf(latexSource: string): Promise<Buffer> {
  const html = buildExportHtml(latexSource);
  const launchOptions = getPuppeteerLaunchOptions();

  if (!launchOptions.executablePath) {
    throw new Error(
      "PDF export needs Chrome or Edge. Install a browser, or run: npx puppeteer browsers install chrome"
    );
  }

  const browser = await puppeteer.launch(launchOptions);

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "load" });
    const pdf = await page.pdf({
      format: "letter",
      printBackground: true,
      margin: { top: "0.5in", right: "0.5in", bottom: "0.5in", left: "0.5in" },
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}

export async function exportToDocx(latexSource: string): Promise<Buffer> {
  const html = buildExportHtml(latexSource);
  try {
    const mod = await import("html-docx-js-typescript");
    const asBlob = mod.asBlob || mod.default?.asBlob;
    if (typeof asBlob === "function") {
      const blob = await asBlob(html);
      if (Buffer.isBuffer(blob)) {
        return blob;
      }
      const arrayBuffer = await (blob as Blob).arrayBuffer();
      return Buffer.from(arrayBuffer);
    }
  } catch {
    // fall through to plain text docx-like export
  }

  const plain = htmlToPlainText(latexToHtml(latexSource));
  const rtf = `{\\rtf1\\ansi\\deff0 ${plain.replace(/\n/g, "\\par ")}}`;
  return Buffer.from(rtf, "utf-8");
}

export function exportToTex(latexSource: string): Buffer {
  return Buffer.from(latexSource, "utf-8");
}

export function exportToPlainText(latexSource: string): Buffer {
  const plain = htmlToPlainText(latexToHtml(latexSource));
  return Buffer.from(plain, "utf-8");
}
