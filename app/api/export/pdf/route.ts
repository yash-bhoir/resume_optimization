import { NextRequest } from "next/server";
import { exportToPdf } from "@/lib/export";
import { requireAuth } from "@/lib/auth";
import { rateLimitExport } from "@/lib/rate-limit";
import { latexExportSchema } from "@/lib/schemas";
import { validateRequest } from "@/lib/validate";
import { getRouteContext, withRouteLogging } from "@/lib/api-route";
import { requireJsonContentType } from "@/lib/request-guards";
import { jsonError, jsonValidationError } from "@/lib/api-response";
import { toSafeClientMessage, toHttpStatusFromError } from "@/lib/safe-error";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";
export const maxDuration = 60;

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
      const parsed = validateRequest(latexExportSchema, body);
      if (!parsed.success) {
        return jsonValidationError(parsed.fields);
      }

      const pdfBuffer = await exportToPdf(parsed.data.latexSource);

      logger.info({ userId: authResult.userId }, "PDF exported");

      return new Response(new Uint8Array(pdfBuffer), {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": 'attachment; filename="optimized-resume.pdf"',
        },
      });
    } catch (err) {
      logger.error({ err }, "PDF export failed");
      const status = toHttpStatusFromError(err, 500);
      return jsonError(
        toSafeClientMessage(err, "PDF export failed. Try again or choose another format."),
        status === 503 ? "SERVICE_UNAVAILABLE" : "PDF_EXPORT_FAILED",
        status
      );
    }
  });
}
