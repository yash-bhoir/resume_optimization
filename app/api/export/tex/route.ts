import { NextRequest } from "next/server";
import { exportToTex, exportToPlainText } from "@/lib/export";
import { jsonError } from "@/lib/api-response";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { latexSource, format = "tex" } = body;

    if (!latexSource || typeof latexSource !== "string") {
      return jsonError("latexSource is required", "INVALID_LATEX");
    }

    if (format === "txt") {
      const buffer = exportToPlainText(latexSource);
      return new Response(new Uint8Array(buffer), {
        status: 200,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Content-Disposition": 'attachment; filename="optimized-resume.txt"',
        },
      });
    }

    const buffer = exportToTex(latexSource);
    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/x-tex",
        "Content-Disposition": 'attachment; filename="optimized-resume.tex"',
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Export failed";
    return jsonError(message, "EXPORT_FAILED", 500);
  }
}
