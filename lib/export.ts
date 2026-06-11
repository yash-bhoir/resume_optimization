import { buildExportHtml, htmlToPlainText, latexToHtml } from "./latex-to-html";
import { withBrowserPage } from "./puppeteer-pool";

export async function exportToPdf(latexSource: string): Promise<Buffer> {
  const html = buildExportHtml(latexSource);

  const pdf = await withBrowserPage(async (page) => {
    await page.setContent(html, { waitUntil: "load", timeout: 30_000 });
    return page.pdf({
      format: "letter",
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    });
  });

  return Buffer.from(pdf);
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
