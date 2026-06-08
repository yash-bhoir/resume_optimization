import { calculateMatchScore } from "./match-score";
import { validateBulletMetrics } from "./metric-validator";
import { resumeToPlainText, isLatexSource } from "./resume-text";

export interface AtsBreakdown {
  keywordScore: number;
  skillsScore: number;
  structureScore: number;
  parseScore: number;
  measurableScore: number;
  contentScore: number;
}

export interface AtsScoreResult {
  total: number;
  breakdown: AtsBreakdown;
}

const REQUIRED_SKILL_PATTERNS = [
  /\b(?:required|must have|must-have|essential)\b[^.]{0,200}/gi,
  /\b(?:proficien\w+|experien\w+)\s+(?:in|with)\s+([^.]{5,120})/gi,
];

const STANDARD_SECTIONS = ["summary", "education", "experience", "projects", "skills"];

function extractRequiredSkills(jobDescription: string): string[] {
  const skills = new Set<string>();
  const techPattern =
    /\b(?:node\.?js|react\.?js|express\.?js|mongodb|typescript|javascript|python|java|aws|docker|kubernetes|graphql|postgresql|sql|nosql|mern|rest\s*api|agile|scrum|ci\/cd|next\.?js|vue\.?js|angular|redis|git|linux)\b/gi;

  for (const match of jobDescription.match(techPattern) || []) {
    skills.add(match.toLowerCase().replace(/\s+/g, " ").trim());
  }

  for (const pattern of REQUIRED_SKILL_PATTERNS) {
    for (const block of jobDescription.match(pattern) || []) {
      for (const m of block.match(techPattern) || []) {
        skills.add(m.toLowerCase());
      }
    }
  }

  return Array.from(skills);
}

function calculateRequiredSkillsMatch(jobDescription: string, resumeText: string): number {
  const required = extractRequiredSkills(jobDescription);
  if (required.length === 0) return 70;

  const plain = resumeToPlainText(resumeText, isLatexSource(resumeText));
  let matched = 0;
  for (const skill of required) {
    if (plain.includes(skill)) matched++;
  }
  return Math.min(100, Math.round((matched / required.length) * 100));
}

function calculateStructureScore(resumeText: string): number {
  const plain = resumeToPlainText(resumeText, isLatexSource(resumeText));
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
  const keywordScore = calculateMatchScore(jobDescription, resumeText);
  const skillsScore = calculateRequiredSkillsMatch(jobDescription, resumeText);
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

  const total = Math.round(
    keywordScore * 0.3 +
      skillsScore * 0.2 +
      structureScore * 0.15 +
      parseScore * 0.1 +
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
