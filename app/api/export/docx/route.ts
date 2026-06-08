import { NextRequest } from "next/server";
import { exportToDocx } from "@/lib/export";
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

    const docxBuffer = await exportToDocx(latexSource);

    return new Response(new Uint8Array(docxBuffer), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": 'attachment; filename="optimized-resume.docx"',
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "DOCX export failed";
    return jsonError(message, "DOCX_EXPORT_FAILED", 500);
  }
}
