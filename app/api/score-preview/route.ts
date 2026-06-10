import { NextRequest } from "next/server";
import { calculateMatchScore } from "@/lib/match-score";
import { calculateAtsScore } from "@/lib/ats-score";
import { analyzeResume } from "@/lib/resume-analysis";
import { withCategoryScores } from "@/lib/category-scores";
import { isLatexSource } from "@/lib/resume-text";
import { scorePreviewSchema } from "@/lib/schemas";
import { validateRequest } from "@/lib/validate";
import { getClientIdentifier } from "@/lib/request-client";
import { getOptionalUserId } from "@/lib/auth";
import { rateLimitPreview } from "@/lib/rate-limit";
import { getCachedScorePreview, setCachedScorePreview } from "@/lib/ats-cache";
import { getRouteContext, withRouteLogging } from "@/lib/api-route";
import { requireJsonContentType } from "@/lib/request-guards";
import { jsonError, jsonOk, jsonValidationError } from "@/lib/api-response";
import { toSafeClientMessage } from "@/lib/safe-error";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(request: NextRequest) {
  const userId = await getOptionalUserId();
  const identifier = userId ?? getClientIdentifier(request);
  const ctx = getRouteContext(request, userId);

  return withRouteLogging(ctx, async () => {
    try {
      const rate = await rateLimitPreview(identifier);
      if (!rate.success) {
        return jsonError("Too many preview requests. Try again later.", "RATE_LIMITED", 429);
      }

      const contentTypeError = requireJsonContentType(request);
      if (contentTypeError) return contentTypeError;

      const body = await request.json();
      const parsed = validateRequest(scorePreviewSchema, body);

      if (!parsed.success) {
        return jsonValidationError(parsed.fields);
      }

      const { resumeText, jobDescription } = parsed.data;
      const trimmedResume = resumeText.trim();
      const trimmedJd = jobDescription.trim();

      const cached = getCachedScorePreview(trimmedResume, trimmedJd);
      if (cached) {
        return jsonOk({
          matchScoreBefore: cached.matchScoreBefore,
          atsScoreBefore: cached.atsScoreBefore,
          atsBreakdownBefore: cached.atsBreakdownBefore,
          analysisBefore: cached.analysisBefore,
          cached: true,
        });
      }

      const isLatex = isLatexSource(trimmedResume);

      const matchScoreBefore = calculateMatchScore(trimmedJd, trimmedResume);
      const atsBefore = calculateAtsScore(trimmedJd, trimmedResume, isLatex);
      const analysisBefore = withCategoryScores(
        analyzeResume(trimmedResume, isLatex, trimmedJd),
        atsBefore.breakdown,
        matchScoreBefore,
        true
      );

      setCachedScorePreview(trimmedResume, trimmedJd, {
        matchScoreBefore,
        atsScoreBefore: atsBefore.total,
        atsBreakdownBefore: atsBefore.breakdown,
        analysisBefore,
      });

      logger.info({ matchScoreBefore, atsBefore: atsBefore.total }, "Score preview generated");

      return jsonOk({
        matchScoreBefore,
        atsScoreBefore: atsBefore.total,
        atsBreakdownBefore: atsBefore.breakdown,
        analysisBefore,
      });
    } catch (err) {
      logger.error({ err }, "Score preview failed");
      return jsonError(
        toSafeClientMessage(err, "Could not generate score preview. Check your inputs and try again."),
        "PREVIEW_FAILED",
        500
      );
    }
  });
}
