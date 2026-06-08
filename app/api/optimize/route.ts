import { NextRequest } from "next/server";
import {
  SYSTEM_PROMPT,
  buildOptimizePrompt,
} from "@/lib/latex-template";
import { optimizeResume } from "@/lib/openai";
import { calculateMatchScore, generateFallbackChangeLog } from "@/lib/match-score";
import { calculateAtsScore, calculateOptimizationGain } from "@/lib/ats-score";
import { generateChangeLog } from "@/lib/resume-diff";
import { estimatePageFitFromLatex } from "@/lib/page-fit";
import { analyzeResume } from "@/lib/resume-analysis";
import { withCategoryScores } from "@/lib/category-scores";
import { isLatexSource } from "@/lib/resume-text";
import { jsonError, jsonOk } from "@/lib/api-response";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { resumeText, jobDescription } = body;

    if (!resumeText || typeof resumeText !== "string" || resumeText.trim().length < 20) {
      return jsonError("Valid resumeText is required", "INVALID_RESUME");
    }
    if (!jobDescription || typeof jobDescription !== "string" || jobDescription.trim().length < 20) {
      return jsonError("Valid jobDescription is required", "INVALID_JD");
    }

    const trimmedResume = resumeText.trim();
    const trimmedJd = jobDescription.trim();

    const isBeforeLatex = isLatexSource(trimmedResume);

    const scoreBefore = calculateMatchScore(trimmedJd, trimmedResume);
    const atsBefore = calculateAtsScore(trimmedJd, trimmedResume, isBeforeLatex);
    const analysisBefore = withCategoryScores(
      analyzeResume(trimmedResume, isBeforeLatex, trimmedJd),
      atsBefore.breakdown,
      scoreBefore,
      true
    );

    const optimizePrompt = buildOptimizePrompt(trimmedResume, trimmedJd);
    const latexSource = await optimizeResume(SYSTEM_PROMPT, optimizePrompt, trimmedResume);

    const scoreAfter = calculateMatchScore(trimmedJd, latexSource);
    const atsAfter = calculateAtsScore(trimmedJd, latexSource, true);
    let analysisAfter = withCategoryScores(
      analyzeResume(latexSource, true, trimmedJd),
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

    const fit = estimatePageFitFromLatex(latexSource);

    return jsonOk({
      latexSource,
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
      // backward compat
      matchScore: scoreAfter,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Optimization failed";
    const code =
      message.includes("quota") ||
      message.includes("Quota") ||
      message.includes("rate limit") ||
      message.includes("Rate limit")
        ? "QUOTA_EXCEEDED"
        : "OPTIMIZE_FAILED";
    return jsonError(message, code, code === "QUOTA_EXCEEDED" ? 429 : 500);
  }
}
