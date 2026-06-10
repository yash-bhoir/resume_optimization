import type { AtsBreakdown, CategoryScores, ResumeAnalysis } from "@/types";

export function computeCategoryScores(
  analysis: ResumeAnalysis,
  atsBreakdown: AtsBreakdown,
  keywordMatch: number,
  hasJobDescription: boolean
): CategoryScores {
  const repPenalty = analysis.repetitionWarnings.reduce(
    (sum, w) => sum + Math.max(0, w.count - 2) * 8,
    0
  );
  const repetition = Math.max(0, 100 - repPenalty);

  const contentIssueCount =
    (analysis.sectionIssues.Content || 0) + (analysis.sectionIssues.Summary || 0);
  const expMeasurable =
    analysis.experienceMeasurablePercent ?? analysis.measurablePercent;
  const measurableGap = Math.max(0, 100 - expMeasurable);
  const content = Math.max(
    0,
    Math.min(100, Math.round(100 - contentIssueCount * 8 - measurableGap * 0.35))
  );

  const contactIssues = analysis.sectionIssues.Contact || 0;
  const sections = Math.max(
    0,
    Math.min(100, atsBreakdown.structureScore - contactIssues * 5)
  );

  const atsEssentials = Math.round(
    atsBreakdown.parseScore * 0.5 +
      atsBreakdown.contentScore * 0.3 +
      atsBreakdown.skillsScore * 0.2
  );

  return {
    content,
    sections,
    atsEssentials,
    tailoring: hasJobDescription ? keywordMatch : null,
    measurable: expMeasurable,
    repetition,
  };
}

/** Single report score aligned with Enhancv-style category breakdown. */
export function computeReportScore(categoryScores: CategoryScores): number {
  const tailoring = categoryScores.tailoring ?? 65;
  return Math.min(
    100,
    Math.round(
      categoryScores.content * 0.2 +
        tailoring * 0.25 +
        categoryScores.measurable * 0.28 +
        categoryScores.repetition * 0.15 +
        categoryScores.sections * 0.07 +
        categoryScores.atsEssentials * 0.05
    )
  );
}

export function withCategoryScores(
  analysis: ResumeAnalysis,
  atsBreakdown: AtsBreakdown,
  keywordMatch: number,
  hasJobDescription: boolean
): ResumeAnalysis {
  const categoryScores = computeCategoryScores(
    analysis,
    atsBreakdown,
    keywordMatch,
    hasJobDescription
  );
  const score = computeReportScore(categoryScores);
  return {
    ...analysis,
    score,
    grade: score >= 85 ? "EXCELLENT" : score >= 72 ? "GOOD" : score >= 55 ? "FAIR" : "NEEDS WORK",
    categoryScores,
  };
}
