import { NextRequest } from "next/server";
import {
  detectFormat,
  parseResumeStructured,
  validateUpload,
} from "@/lib/parse-resume";
import { validateFileMagicBytes, validateFileSize } from "@/lib/file-validation";
import { getClientIdentifier } from "@/lib/request-client";
import { getOptionalUserId } from "@/lib/auth";
import { rateLimitParse } from "@/lib/rate-limit";
import { getRouteContext, withRouteLogging } from "@/lib/api-route";
import { jsonError, jsonOk } from "@/lib/api-response";
import { toSafeClientMessage } from "@/lib/safe-error";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(request: NextRequest) {
  const userId = await getOptionalUserId();
  const identifier = userId ?? getClientIdentifier(request);
  const ctx = getRouteContext(request, userId);

  return withRouteLogging(ctx, async () => {
    try {
      const rate = await rateLimitParse(identifier);
      if (!rate.success) {
        return jsonError("Too many upload requests. Try again later.", "RATE_LIMITED", 429);
      }

      const formData = await request.formData();
      const files = formData.getAll("file");

      if (files.length !== 1) {
        return jsonError("Upload one resume file at a time.", "INVALID_UPLOAD", 400);
      }

      const file = files[0];
      if (!file || !(file instanceof File)) {
        return jsonError("No file uploaded", "NO_FILE", 400);
      }

      const validation = validateUpload(file);
      if (!validation.valid) {
        return jsonError(validation.error!, validation.code!, validation.status ?? 400);
      }

      const detectedFormat = detectFormat(file);
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const sizeCheck = validateFileSize(buffer);
      if (!sizeCheck.valid) {
        return jsonError(sizeCheck.error!, sizeCheck.code!, sizeCheck.status ?? 400);
      }

      const magic = validateFileMagicBytes(buffer, detectedFormat);
      if (!magic.valid) {
        return jsonError(magic.error!, magic.code ?? "INVALID_FILE_CONTENT", 400);
      }

      const parsed = await parseResumeStructured(buffer, detectedFormat);

      logger.info({ format: detectedFormat, textLength: parsed.rawText.length }, "Resume parsed");

      return jsonOk({ ...parsed });
    } catch (err) {
      logger.error({ err }, "Parse resume failed");
      return jsonError(
        toSafeClientMessage(err, "We couldn't read that file. Try a text-based PDF or DOCX."),
        "PARSE_FAILED",
        400
      );
    }
  });
}
