import { NextRequest } from "next/server";
import { exportToTex, exportToPlainText } from "@/lib/export";
import { requireAuth } from "@/lib/auth";
import { rateLimitExport } from "@/lib/rate-limit";
import { texExportSchema } from "@/lib/schemas";
import { validateRequest } from "@/lib/validate";
import { getRouteContext, withRouteLogging } from "@/lib/api-route";
import { requireJsonContentType } from "@/lib/request-guards";
import { jsonError, jsonValidationError } from "@/lib/api-response";
import { toSafeClientMessage } from "@/lib/safe-error";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const authResult = await requireAuth();
  if (authResult.error) return authResult.error;

  const ctx = getRouteContext(request, authResult.userId);

  return withRouteLogging(ctx, async () => {
    try {
      const rate = await rateLimitExport(authResult.userId);
      if (!rate.success) {
        return jsonError("Too many export requests. Try again later.", "RATE_LIMITED", 429);
      }

      const contentTypeError = requireJsonContentType(request);
      if (contentTypeError) return contentTypeError;

      const body = await request.json();
      const parsed = validateRequest(texExportSchema, body);
      if (!parsed.success) {
        return jsonValidationError(parsed.fields);
      }

      if (parsed.data.format === "txt") {
        const buffer = exportToPlainText(parsed.data.latexSource);
        return new Response(new Uint8Array(buffer), {
          status: 200,
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Content-Disposition": 'attachment; filename="optimized-resume.txt"',
          },
        });
      }

      const buffer = exportToTex(parsed.data.latexSource);
      return new Response(new Uint8Array(buffer), {
        status: 200,
        headers: {
          "Content-Type": "application/x-tex",
          "Content-Disposition": 'attachment; filename="optimized-resume.tex"',
        },
      });
    } catch (err) {
      return jsonError(
        toSafeClientMessage(err, "Export failed. Try again."),
        "EXPORT_FAILED",
        500
      );
    }
  });
}
