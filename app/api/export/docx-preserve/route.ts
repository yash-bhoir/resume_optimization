import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getUserPlan } from "@/lib/credits";
import { rateLimitExport } from "@/lib/rate-limit";
import { docxPreserveSchema } from "@/lib/schemas";
import { validateRequest } from "@/lib/validate";
import { decodeBase64Payload, validateDocxBuffer } from "@/lib/docx-bytes";
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
      const plan = await getUserPlan(authResult.userId);
      if (plan !== "pro") {
        return jsonError(
          "Preserve layout export is a Pro feature.",
          "PRO_REQUIRED",
          403
        );
      }

      const rate = await rateLimitExport(authResult.userId);
      if (!rate.success) {
        return jsonError("Too many export requests. Try again later.", "RATE_LIMITED", 429);
      }

      const contentTypeError = requireJsonContentType(request);
      if (contentTypeError) return contentTypeError;

      const body = await request.json();
      const parsed = validateRequest(docxPreserveSchema, body);
      if (!parsed.success) {
        return jsonValidationError(parsed.fields);
      }

      const buffer = decodeBase64Payload(parsed.data.preservedDocxBase64);
      if (!buffer) {
        return jsonError("Invalid DOCX data", "INVALID_FILE_CONTENT", 400);
      }

      const docxCheck = validateDocxBuffer(buffer);
      if (!docxCheck.valid) {
        return jsonError(docxCheck.error!, docxCheck.code ?? "INVALID_FILE_CONTENT", 400);
      }

      return new Response(new Uint8Array(buffer), {
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "Content-Disposition": 'attachment; filename="optimized-resume.docx"',
        },
      });
    } catch (err) {
      return jsonError(
        toSafeClientMessage(err, "DOCX export failed. Try again."),
        "EXPORT_FAILED",
        500
      );
    }
  });
}
