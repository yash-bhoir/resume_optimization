import {
  calculateMatchScore,
  priorityKeywordCoverage,
} from "./match-score";
import { validateBulletMetrics } from "./metric-validator";
import { resumeToPlainText, isLatexSource } from "./resume-text";

export interface AtsBreakdown {
  keywordScore: number;
  skillsScore: number;
  structureScore: number;
  parseScore: number;
  measurableScore: number;
  contentScore: number;
  /** Share of priority JD terms found in the resume (0–100). */
  jdCoveragePercent?: number;
  jdKeywordsMatched?: number;
  jdKeywordsTotal?: number;
}

export interface AtsScoreResult {
  total: number;
  breakdown: AtsBreakdown;
}

const STANDARD_SECTIONS = ["summary", "education", "experience", "projects", "skills"];

function calculateStructureScore(resumeText: string): number {
  const plain = resumeToPlainText(resumeText, isLatexSource(resumeText)).toLowerCase();
  let found = 0;
  for (const section of STANDARD_SECTIONS) {
    if (plain.includes(section)) found++;
  }

  const hasBullets =
    resumeText.includes("\\resumeItem") ||
    /[•\-\*]\s/.test(resumeText) ||
    plain.split(".").length > 3;

  const base = Math.round((found / STANDARD_SECTIONS.length) * 80);
  return Math.min(100, base + (hasBullets ? 20 : 0));
}

function calculateParseQualityScore(resumeText: string): number {
  let score = 100;
  const isLatex = isLatexSource(resumeText);
  const plain = resumeToPlainText(resumeText, isLatex);

  if (!/\b\d{3}[-.\s]?\d{3,4}[-.\s]?\d{4}\b/.test(plain) && !/@/.test(plain)) {
    score -= 15;
  }
  if (isLatex && resumeText.includes("\\section{Technical Skills}") && !/\\textbf\{[^}]+\}\{:/.test(resumeText)) {
    score -= 15;
  }

  return Math.max(0, score);
}

export function calculateAtsScore(
  jobDescription: string,
  resumeText: string,
  isLatex?: boolean
): AtsScoreResult {
  const resolvedLatex = isLatex ?? isLatexSource(resumeText);
  const jdCoverage = priorityKeywordCoverage(jobDescription, resumeText);
  const keywordScore = jdCoverage.percent;
  const skillsScore = calculateMatchScore(jobDescription, resumeText);
  const structureScore = calculateStructureScore(resumeText);
  const parseScore = calculateParseQualityScore(resumeText);
  const metrics = validateBulletMetrics(resumeText, resolvedLatex);
  const measurableScore =
    metrics.total > 0
      ? Math.round((metrics.withMetrics / metrics.total) * 100)
      : 70;

  const plain = resumeToPlainText(resumeText, resolvedLatex);
  let contentScore = 100;
  if (/\b(?:i am|i'm)\b/i.test(plain)) contentScore -= 15;
  if (/\b(?:responsible for|worked on|helped with)\b/i.test(plain)) contentScore -= 10;
  if ((plain.match(/\bdesigned\b/gi) || []).length >= 4) contentScore -= 10;
  contentScore = Math.max(0, contentScore);

  // JD alignment is the primary signal — derived from this specific job description
  const jdAlignment = Math.round(keywordScore * 0.7 + skillsScore * 0.3);

  const total = Math.round(
    jdAlignment * 0.55 +
      structureScore * 0.12 +
      parseScore * 0.08 +
      measurableScore * 0.15 +
      contentScore * 0.1
  );

  return {
    total: Math.min(100, total),
    breakdown: {
      keywordScore,
      skillsScore,
      structureScore,
      parseScore,
      measurableScore,
      contentScore,
      jdCoveragePercent: jdCoverage.percent,
      jdKeywordsMatched: jdCoverage.matched,
      jdKeywordsTotal: jdCoverage.total,
    },
  };
}

export function calculateOptimizationGain(before: number, after: number): {
  gain: number;
  percentImprovement: number;
} {
  const gain = after - before;
  const percentImprovement =
    before > 0 ? Math.round((gain / before) * 100) : after > 0 ? 100 : 0;
  return { gain, percentImprovement };
}
