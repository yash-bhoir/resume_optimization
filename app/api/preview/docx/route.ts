import { NextRequest } from "next/server";
import { docxBufferToPdf } from "@/lib/docx-preview";
import { detectFormat, validateUpload } from "@/lib/parse-resume";
import { validateFileMagicBytes, validateFileSize } from "@/lib/file-validation";
import { getOptionalUserId } from "@/lib/auth";
import { getClientIdentifier } from "@/lib/request-client";
import { rateLimitPreview } from "@/lib/rate-limit";
import { getRouteContext, withRouteLogging } from "@/lib/api-route";
import { jsonError } from "@/lib/api-response";
import { toSafeClientMessage, toHttpStatusFromError } from "@/lib/safe-error";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const userId = await getOptionalUserId();
  const ctx = getRouteContext(request, userId);

  return withRouteLogging(ctx, async () => {
    try {
      const rate = await rateLimitPreview(userId ?? getClientIdentifier(request));
      if (!rate.success) {
        return jsonError("Too many preview requests. Try again later.", "RATE_LIMITED", 429);
      }

      const formData = await request.formData();
      const file = formData.get("file");
      if (!file || !(file instanceof File)) {
        return jsonError("No file uploaded", "NO_FILE", 400);
      }

      const validation = validateUpload(file);
      if (!validation.valid) {
        return jsonError(validation.error!, validation.code!, validation.status ?? 400);
      }

      if (detectFormat(file) !== "docx") {
        return jsonError("Only DOCX files are supported for this preview.", "INVALID_FORMAT", 400);
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const sizeCheck = validateFileSize(buffer);
      if (!sizeCheck.valid) {
        return jsonError(sizeCheck.error!, sizeCheck.code!, sizeCheck.status ?? 400);
      }

      const magic = validateFileMagicBytes(buffer, "docx");
      if (!magic.valid) {
        return jsonError(magic.error!, magic.code ?? "INVALID_FILE_CONTENT", 400);
      }

      const pdfBuffer = await docxBufferToPdf(buffer);
      logger.info({ userId: userId ?? "guest", bytes: pdfBuffer.length }, "DOCX preview PDF generated");

      return new Response(new Uint8Array(pdfBuffer), {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Cache-Control": "private, max-age=300",
        },
      });
    } catch (err) {
      logger.error({ err }, "DOCX preview failed");
      const status = toHttpStatusFromError(err, 500);
      return jsonError(
        toSafeClientMessage(err, "Could not preview this DOCX file."),
        "PREVIEW_FAILED",
        status
      );
    }
  });
}
