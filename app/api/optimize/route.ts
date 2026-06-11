import { NextRequest } from "next/server";
import { optimizeResumeDocument, reflowResumeDocument } from "@/lib/openai";
import {
  calculateMatchScore,
  calibrateOptimizedMatchScore,
  calibrateOptimizedAtsScore,
} from "@/lib/match-score";
import { calculateAtsScore, calculateOptimizationGain } from "@/lib/ats-score";
import { generateChangeLog, generateFallbackChangeLog } from "@/lib/change-log";
import { estimatePageFitFromLatex } from "@/lib/page-fit";
import { analyzeResume } from "@/lib/resume-analysis";
import { withCategoryScores } from "@/lib/category-scores";
import { isLatexSource } from "@/lib/resume-text";
import { getOptionalUserId } from "@/lib/auth";
import { getClientIdentifier } from "@/lib/request-client";
import { rateLimitOptimize } from "@/lib/rate-limit";
import {
  getCreditStatus,
  reserveCredit,
  releaseCredit,
  getUserPlan,
  type CreditDeductionSource,
} from "@/lib/credits";
import { optimizeRequestSchema } from "@/lib/schemas";
import { validateRequest } from "@/lib/validate";
import { jsonError, jsonOk, jsonValidationError, jsonCreditsExceeded } from "@/lib/api-response";
import { getRouteContext, withRouteLogging } from "@/lib/api-route";
import { requireJsonContentType } from "@/lib/request-guards";
import { toSafeClientMessage, toHttpStatusFromError } from "@/lib/safe-error";
import { logger } from "@/lib/logger";
import type { ResumeDocument } from "@/types/resume-document";
import { normalizeContact } from "@/lib/contact-normalize";
import { parseTextToDocument, documentToPlainText } from "@/lib/resume-schema";
import { renderOptimizedOutput } from "@/lib/preserve-layout";
import { resolveEffectiveMode } from "@/lib/pdf-to-docx";
import { getPricingSettings } from "@/lib/app-settings";
import { saveOptimizationHistory } from "@/lib/optimization-history";
import { randomUUID } from "crypto";
import type { DetectedFormat } from "@/types";

export const runtime = "nodejs";
export const maxDuration = 180;

export async function POST(request: NextRequest) {
  const userId = await getOptionalUserId();
  const ctx = getRouteContext(request, userId);

  return withRouteLogging(ctx, async () => {
    let creditReserved = false;
    let deductionSource: CreditDeductionSource | null = null;

    try {
      const settings = await getPricingSettings();
      if (!userId && settings.requireSignInToOptimize) {
        return jsonError(
          "Sign in to optimize your resume. Free accounts get monthly credits.",
          "LOGIN_REQUIRED",
          401
        );
      }

      const rate = await rateLimitOptimize(userId ?? getClientIdentifier(request));
      if (!rate.success) {
        return jsonError("Too many optimization requests. Try again in an hour.", "RATE_LIMITED", 429);
      }

      const contentTypeError = requireJsonContentType(request);
      if (contentTypeError) return contentTypeError;

      if (userId) {
        const creditPreview = await getCreditStatus(userId);
        if (!creditPreview.allowed) {
          return jsonCreditsExceeded(creditPreview);
        }
      }

      const body = await request.json();
      const parsed = validateRequest(optimizeRequestSchema, body);
      if (!parsed.success) {
        return jsonValidationError(parsed.fields);
      }

      const {
        resumeText,
        jobDescription,
        optimizationMode,
        detectedFormat,
        originalFileBase64,
        originalTexSource,
        originalFileName,
        sessionId: clientSessionId,
        resumeDocument: clientDocument,
        pageLayout,
      } = parsed.data;

      if (optimizationMode === "preserve") {
        if (!userId) {
          return jsonError(
            "Sign in to use preserve layout mode, or upgrade to Pro for full access.",
            "LOGIN_REQUIRED",
            401
          );
        }
        const plan = await getUserPlan(userId);
        if (plan !== "pro") {
          return jsonError(
            "Preserve layout mode is a Pro feature. Upgrade to keep your original DOCX design.",
            "PRO_REQUIRED",
            403
          );
        }
      }

      if (userId) {
        const reserved = await reserveCredit(userId);
        if (!reserved) {
          return jsonCreditsExceeded(await getCreditStatus(userId));
        }
        creditReserved = true;
        deductionSource = reserved.deductionSource;
      }

      const trimmedResume = resumeText.trim();
      const trimmedJd = jobDescription.trim();
      const format = (detectedFormat as DetectedFormat) || "pdf";
      const mode = optimizationMode;

      const isBeforeLatex = isLatexSource(trimmedResume);
      const originalDoc: ResumeDocument =
        clientDocument && typeof clientDocument === "object"
          ? {
              ...(clientDocument as ResumeDocument),
              contact: normalizeContact((clientDocument as ResumeDocument).contact),
              rawPlainText: (clientDocument as ResumeDocument).rawPlainText || trimmedResume,
            }
          : (() => {
              const doc = parseTextToDocument(trimmedResume, isBeforeLatex);
              doc.contact = normalizeContact(doc.contact);
              return doc;
            })();

      const { mode: effectiveMode, note: modeNote } = resolveEffectiveMode(mode, format);

      const scoreBefore = calculateMatchScore(trimmedJd, trimmedResume);
      const atsBefore = calculateAtsScore(trimmedJd, trimmedResume, isBeforeLatex);
      const analysisBefore = withCategoryScores(
        analyzeResume(trimmedResume, isBeforeLatex, trimmedJd),
        atsBefore.breakdown,
        scoreBefore,
        true
      );

      const optimizedDoc = await optimizeResumeDocument(originalDoc, trimmedJd, pageLayout);

      let renderResult = await renderOptimizedOutput(effectiveMode, format, optimizedDoc, {
        originalFileBase64,
        originalTexSource: originalTexSource ?? (isBeforeLatex ? trimmedResume : undefined),
        originalDoc,
      });

      let latexSource = renderResult.latexSource;
      let fit = estimatePageFitFromLatex(latexSource);
      let finalDoc = optimizedDoc;

      if (pageLayout === "single_page" && fit.pageCount > 1) {
        finalDoc = await reflowResumeDocument(finalDoc, originalDoc, trimmedJd, "single_page");
        renderResult = await renderOptimizedOutput(effectiveMode, format, finalDoc, {
          originalFileBase64,
          originalTexSource: originalTexSource ?? (isBeforeLatex ? trimmedResume : undefined),
          originalDoc,
        });
        latexSource = renderResult.latexSource;
        fit = estimatePageFitFromLatex(latexSource);
      } else if (pageLayout === "balanced" && fit.issue === "underflow") {
        finalDoc = await reflowResumeDocument(finalDoc, originalDoc, trimmedJd, "fill_page");
        renderResult = await renderOptimizedOutput(effectiveMode, format, finalDoc, {
          originalFileBase64,
          originalTexSource: originalTexSource ?? (isBeforeLatex ? trimmedResume : undefined),
          originalDoc,
        });
        latexSource = renderResult.latexSource;
        fit = estimatePageFitFromLatex(latexSource);
      }

      const afterPlain = documentToPlainText(finalDoc);

      const scoreAfterRaw = calculateMatchScore(trimmedJd, afterPlain);
      const scoreAfter = calibrateOptimizedMatchScore(
        scoreBefore,
        scoreAfterRaw,
        trimmedJd,
        afterPlain
      );
      const atsAfterRaw = calculateAtsScore(trimmedJd, latexSource, true);
      const atsAfter = {
        ...atsAfterRaw,
        total: calibrateOptimizedAtsScore(atsBefore.total, atsAfterRaw.total, scoreAfter),
      };
      let analysisAfter = withCategoryScores(
        analyzeResume(afterPlain, false, trimmedJd),
        atsAfter.breakdown,
        scoreAfter,
        true
      );

      if (atsAfter.total >= atsBefore.total && analysisAfter.score < analysisBefore.score) {
        analysisAfter = {
          ...analysisAfter,
          score: analysisBefore.score,
          grade: analysisBefore.grade,
        };
      }

      const keywordGain = scoreAfter - scoreBefore;
      const { percentImprovement: keywordPercent } = calculateOptimizationGain(
        scoreBefore,
        scoreAfter
      );
      const { gain: atsGain } = calculateOptimizationGain(atsBefore.total, atsAfter.total);

      const changeItems = generateChangeLog(trimmedResume, latexSource, trimmedJd);
      const changeLog = generateFallbackChangeLog(trimmedResume, latexSource, trimmedJd);

      creditReserved = false;
      const creditsAfter = userId ? await getCreditStatus(userId) : null;

      let historyId: string | null = null;
      if (userId) {
        try {
          historyId = await saveOptimizationHistory({
            clerkId: userId,
            sessionId: clientSessionId || randomUUID(),
            originalFileName,
            detectedFormat: format,
            optimizationMode: mode,
            effectiveMode: renderResult.effectiveMode,
            layoutNote: renderResult.layoutNote || modeNote,
            rawText: trimmedResume,
            jobDescription: trimmedJd,
            latexSource,
            matchScoreBefore: scoreBefore,
            matchScoreAfter: scoreAfter,
            atsScoreBefore: atsBefore.total,
            atsScoreAfter: atsAfter.total,
            optimizationGain: atsGain,
            optimizationPercent: keywordPercent,
            atsBreakdownBefore: atsBefore.breakdown,
            atsBreakdownAfter: atsAfter.breakdown,
            changeLog,
            changeItems,
            pageFit: fit.pageFit,
            pageCount: fit.pageCount,
            analysisBefore,
            analysisAfter,
            resumeDocument: finalDoc,
            preservedTexSource: renderResult.preservedTexSource,
            originalFileBase64: originalFileBase64,
            preservedDocxBase64: renderResult.preservedDocxBase64,
          });
        } catch (historyErr) {
          logger.warn({ err: historyErr, userId }, "Failed to save optimization history");
        }
      }

      logger.info({ userId: userId ?? "guest", scoreBefore, scoreAfter, format }, "Optimization complete");

      return jsonOk({
        historyId,
        latexSource,
        optimizedDocument: finalDoc,
        matchScoreBefore: scoreBefore,
        matchScoreAfter: scoreAfter,
        atsScoreBefore: atsBefore.total,
        atsScoreAfter: atsAfter.total,
        optimizationGain: atsGain,
        optimizationPercent: keywordPercent,
        keywordGain,
        atsBreakdownBefore: atsBefore.breakdown,
        atsBreakdownAfter: atsAfter.breakdown,
        changeLog,
        changeItems,
        pageFit: fit.pageFit,
        pageCount: fit.pageCount,
        analysisBefore,
        analysisAfter,
        optimizationMode: mode,
        effectiveMode: renderResult.effectiveMode,
        layoutNote: renderResult.layoutNote || modeNote,
        preservedDocxBase64: renderResult.preservedDocxBase64,
        preservedTexSource: renderResult.preservedTexSource,
        matchScore: scoreAfter,
        credits: creditsAfter
          ? {
              plan: creditsAfter.plan,
              monthlyLimit: creditsAfter.monthlyLimit,
              monthlyUsed: creditsAfter.monthlyUsed,
              monthlyRemaining: creditsAfter.monthlyRemaining,
              packBalance: creditsAfter.packBalance,
              totalAvailable: creditsAfter.totalAvailable,
              resetDate: creditsAfter.resetDate,
            }
          : null,
        usage: creditsAfter
          ? {
              plan: creditsAfter.plan,
              remaining: creditsAfter.totalAvailable,
              limit: creditsAfter.monthlyLimit,
              used: creditsAfter.monthlyUsed,
            }
          : null,
        requiresLoginForDetails: !userId,
      });
    } catch (err) {
      if (creditReserved && deductionSource && userId) {
        await releaseCredit(userId, deductionSource).catch(() => {});
      }
      logger.error({ err, userId }, "Optimization failed");
      const status = toHttpStatusFromError(err, 500);
      return jsonError(
        toSafeClientMessage(err, "Optimization didn't complete. Try again in a moment."),
        status === 503 ? "SERVICE_UNAVAILABLE" : "OPTIMIZE_FAILED",
        status
      );
    }
  });
}
