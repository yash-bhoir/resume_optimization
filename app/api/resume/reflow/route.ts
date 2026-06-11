import { NextRequest } from "next/server";
import { reflowResumeDocument } from "@/lib/openai";
import { estimatePageFitFromLatex } from "@/lib/page-fit";
import { renderOptimizedOutput } from "@/lib/preserve-layout";
import { reflowRequestSchema } from "@/lib/schemas-reflow";
import { validateRequest } from "@/lib/validate";
import { jsonError, jsonOk, jsonValidationError } from "@/lib/api-response";
import { getRouteContext, withRouteLogging } from "@/lib/api-route";
import { requireJsonContentType } from "@/lib/request-guards";
import { toSafeClientMessage, toHttpStatusFromError } from "@/lib/safe-error";
import { logger } from "@/lib/logger";
import type { ResumeDocument } from "@/types/resume-document";
import type { DetectedFormat } from "@/types";
import { resolveEffectiveMode } from "@/lib/pdf-to-docx";
import { getOptionalUserId } from "@/lib/auth";
import { parseTextToDocument } from "@/lib/resume-schema";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(request: NextRequest) {
  const userId = await getOptionalUserId();
  const ctx = getRouteContext(request, userId);

  return withRouteLogging(ctx, async () => {
    try {
      const contentTypeError = requireJsonContentType(request);
      if (contentTypeError) return contentTypeError;

      const body = await request.json();
      const parsed = validateRequest(reflowRequestSchema, body);
      if (!parsed.success) {
        return jsonValidationError(parsed.fields);
      }

      const {
        resumeDocument,
        originalDocument,
        rawText,
        jobDescription,
        pageLayout,
        optimizationMode,
        detectedFormat,
        originalFileBase64,
        originalTexSource,
      } = parsed.data;

      const doc = resumeDocument as ResumeDocument;
      const original = originalDocument
        ? (originalDocument as ResumeDocument)
        : rawText
          ? parseTextToDocument(rawText)
          : doc;
      const format = (detectedFormat as DetectedFormat) || "pdf";
      const { mode: effectiveMode } = resolveEffectiveMode(optimizationMode, format);

      const reflowed = await reflowResumeDocument(doc, original, jobDescription, pageLayout);
      const renderResult = await renderOptimizedOutput(effectiveMode, format, reflowed, {
        originalFileBase64,
        originalTexSource,
        originalDoc: original,
      });

      const fit = estimatePageFitFromLatex(renderResult.latexSource);

      return jsonOk({
        latexSource: renderResult.latexSource,
        optimizedDocument: reflowed,
        pageFit: fit.pageFit,
        pageCount: fit.pageCount,
        pageLayout,
        effectiveMode: renderResult.effectiveMode,
        preservedDocxBase64: renderResult.preservedDocxBase64,
        preservedTexSource: renderResult.preservedTexSource,
      });
    } catch (err) {
      logger.error({ err, userId }, "Resume reflow failed");
      const status = toHttpStatusFromError(err, 500);
      return jsonError(
        toSafeClientMessage(err, "Could not adjust page layout. Try again."),
        status === 503 ? "SERVICE_UNAVAILABLE" : "REFLOW_FAILED",
        status
      );
    }
  });
}
