import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getOptimizationHistory } from "@/lib/optimization-history";
import { getRouteContext, withRouteLogging } from "@/lib/api-route";
import { jsonError, jsonOk } from "@/lib/api-response";
import { toSafeClientMessage } from "@/lib/safe-error";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth();
  if (authResult.error) return authResult.error;

  const { id } = await params;
  const ctx = getRouteContext(request, authResult.userId);

  return withRouteLogging(ctx, async () => {
    try {
      const record = await getOptimizationHistory(authResult.userId, id);
      if (!record) {
        return jsonError("Optimization not found", "NOT_FOUND", 404);
      }

      return jsonOk({
        id: String(record._id),
        sessionId: record.sessionId,
        originalFileName: record.originalFileName,
        detectedFormat: record.detectedFormat,
        optimizationMode: record.optimizationMode,
        effectiveMode: record.effectiveMode,
        layoutNote: record.layoutNote,
        rawText: record.rawText,
        jobDescription: record.jobDescription,
        latexSource: record.latexSource,
        matchScoreBefore: record.matchScoreBefore,
        matchScoreAfter: record.matchScoreAfter,
        atsScoreBefore: record.atsScoreBefore,
        atsScoreAfter: record.atsScoreAfter,
        optimizationGain: record.optimizationGain,
        optimizationPercent: record.optimizationPercent,
        atsBreakdownBefore: record.atsBreakdownBefore,
        atsBreakdownAfter: record.atsBreakdownAfter,
        changeLog: record.changeLog,
        changeItems: record.changeItems,
        pageFit: record.pageFit,
        pageCount: record.pageCount,
        analysisBefore: record.analysisBefore,
        analysisAfter: record.analysisAfter,
        resumeDocument: record.resumeDocument,
        preservedTexSource: record.preservedTexSource,
        originalFileBase64: record.originalFileBase64,
        preservedDocxBase64: record.preservedDocxBase64,
        createdAt: record.createdAt,
        archivedNote: record.originalFileBase64
          ? undefined
          : "Original upload file is not stored on the server. Re-upload your resume to compare file previews.",
      });
    } catch (err) {
      return jsonError(
        toSafeClientMessage(err, "Failed to load optimization"),
        "HISTORY_LOAD_FAILED",
        500
      );
    }
  });
}
