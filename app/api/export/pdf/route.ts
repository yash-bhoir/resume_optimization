import { NextRequest } from "next/server";
import { exportToPdf } from "@/lib/export";
import { jsonError } from "@/lib/api-response";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { latexSource } = body;

    if (!latexSource || typeof latexSource !== "string") {
      return jsonError("latexSource is required", "INVALID_LATEX");
    }

    const pdfBuffer = await exportToPdf(latexSource);

    return new Response(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="optimized-resume.pdf"',
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "PDF export failed";
    return jsonError(message, "PDF_EXPORT_FAILED", 500);
  }
}
