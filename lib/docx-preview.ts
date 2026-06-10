import { sanitizeHtml } from "./sanitize-html";
import { withBrowserPage } from "./puppeteer-pool";

function wrapDocxHtmlForPrint(html: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <style>
    body {
      font-family: Calibri, "Segoe UI", Arial, sans-serif;
      font-size: 11pt;
      line-height: 1.35;
      color: #111;
      margin: 0;
    }
    p { margin: 0 0 8pt; }
    h1, h2, h3 { margin: 12pt 0 6pt; font-size: 12pt; }
    ul, ol { margin: 0 0 8pt 18pt; padding: 0; }
    li { margin-bottom: 4pt; }
    table { border-collapse: collapse; width: 100%; }
    td, th { padding: 2pt 4pt; vertical-align: top; }
    strong, b { font-weight: 700; }
  </style>
</head>
<body>${html}</body>
</html>`;
}

export async function docxBufferToPdf(buffer: Buffer): Promise<Buffer> {
  const mammoth = await import("mammoth");
  const result = await mammoth.convertToHtml({ buffer });
  const html = wrapDocxHtmlForPrint(sanitizeHtml(result.value));

  const pdf = await withBrowserPage(async (page) => {
    await page.setContent(html, { waitUntil: "load", timeout: 30_000 });
    return page.pdf({
      format: "letter",
      printBackground: true,
      margin: { top: "0.5in", right: "0.5in", bottom: "0.5in", left: "0.5in" },
    });
  });

  return Buffer.from(pdf);
}
