import type { AtsIssue, ResumeAnalysis } from "@/types";
import { calculateMatchScore } from "./match-score";
import { resumeToPlainText, stripLatexInline } from "./resume-text";
import {
  extractBullets,
  extractExperienceBullets,
  bulletHasMetric,
  hasFirstPersonSummary,
} from "./metric-validator";
import { isLatexSource } from "./resume-text";

export type { ResumeAnalysis };

const REPETITION_ALTERNATIVES: Record<string, string[]> = {
  designed: ["architected", "built", "engineered", "planned"],
  automated: ["streamlined", "systematized", "built pipelines for"],
  developed: ["built", "engineered", "created", "shipped"],
  implemented: ["deployed", "rolled out", "integrated", "launched"],
  managed: ["led", "owned", "directed", "oversaw"],
};

const WEAK_VERBS = /\b(?:responsible for|helped with|worked on|involved in|assisted with)\b/gi;

const ACTION_VERBS =
  /\b(?:led|built|owned|optimized|reduced|increased|implemented|architected|delivered|shipped|mentored|drove|spearheaded|engineered|launched)\b/i;

function scoreToGrade(score: number): ResumeAnalysis["grade"] {
  if (score >= 85) return "EXCELLENT";
  if (score >= 72) return "GOOD";
  if (score >= 55) return "FAIR";
  return "NEEDS WORK";
}

export function detectRepetition(plain: string): ResumeAnalysis["repetitionWarnings"] {
  const words = plain.match(/\b[a-z]{5,}\b/g) || [];
  const counts = new Map<string, number>();
  for (const w of words) {
    const lower = w.toLowerCase();
    counts.set(lower, (counts.get(lower) || 0) + 1);
  }

  const warnings: ResumeAnalysis["repetitionWarnings"] = [];
  for (const [word, count] of counts) {
    if (count > 2 && REPETITION_ALTERNATIVES[word]) {
      warnings.push({
        word,
        count,
        alternatives: REPETITION_ALTERNATIVES[word],
      });
    }
  }
  return warnings.sort((a, b) => b.count - a.count).slice(0, 5);
}

export function buildRepetitionRetryPrompt(
  warnings: ResumeAnalysis["repetitionWarnings"]
): string {
  const lines = warnings
    .map(
      (w) =>
        `- "${w.word}" appears ${w.count} times → use instead: ${w.alternatives.join(", ")}`
    )
    .join("\n");

  return `CRITICAL: Over-repeated action verbs hurt ATS content score (Enhancv flags 3+ uses).
Rewrite bullets to use varied verbs — NEVER use the same action verb more than TWICE (2 times) in the full resume.

Repeated words to fix:
${lines}

Rewrite affected bullets only. Keep all jobs, projects, metrics, and skills unchanged.
Return the FULL corrected LaTeX body.`;
}

function checkContact(plain: string, issues: AtsIssue[], sectionIssues: Record<string, number>) {
  let count = 0;
  const hasPhone = /\b\d{3}[-.\s]?\d{3,4}[-.\s]?\d{4}\b/.test(plain);
  const hasEmail = /@/.test(plain);
  const hasLinkedIn = /linkedin\.com/i.test(plain);

  if (!hasPhone) {
    count++;
    issues.push({
      section: "Contact",
      severity: "error",
      message: "Phone number not detected",
      suggestion: "Add a clear phone number in the header contact line",
    });
  }
  if (!hasEmail) {
    count++;
    issues.push({
      section: "Contact",
      severity: "error",
      message: "Email address not detected",
      suggestion: "Add a professional email in the header",
    });
  }
  if (!hasLinkedIn) {
    count++;
    issues.push({
      section: "Contact",
      severity: "warning",
      message: "LinkedIn URL not found",
      suggestion: "Add full LinkedIn URL: https://linkedin.com/in/yourprofile",
    });
  } else if (!/https?:\/\//i.test(plain) && /linkedin/i.test(plain)) {
    count++;
    issues.push({
      section: "Contact",
      severity: "warning",
      message: "LinkedIn may be missing https:// prefix",
      suggestion: "Use full URL for better ATS parsing",
    });
  }

  if (count === 0) {
    issues.push({
      section: "Contact",
      severity: "good",
      message: "Contact information looks complete",
    });
  }
  sectionIssues.Contact = count;
}

function checkSummary(plain: string, isLatex: boolean, text: string, issues: AtsIssue[], sectionIssues: Record<string, number>) {
  let count = 0;
  if (!/summary/i.test(plain)) {
    count++;
    issues.push({
      section: "Summary",
      severity: "error",
      message: "Summary section missing",
      suggestion: "Add a 2–4 line summary with role, years, and key metrics",
    });
  } else if (hasFirstPersonSummary(text, isLatex)) {
    count++;
    issues.push({
      section: "Summary",
      severity: "warning",
      message: 'Summary uses first person ("I am…")',
      suggestion: "Rewrite without I/my — lead with role title and impact",
    });
  } else if (plain.match(/summary[\s\S]{0,350}/i)?.[0] && !METRIC_IN_TEXT(plain)) {
    count++;
    issues.push({
      section: "Summary",
      severity: "warning",
      message: "Summary lacks quantifiable achievements",
      suggestion: "Add 1–2 metrics (years, %, scale) in the summary",
    });
  } else {
    issues.push({
      section: "Summary",
      severity: "good",
      message: "Summary section present with professional tone",
    });
  }
  sectionIssues.Summary = count;
}

const METRIC_IN_TEXT = (plain: string) =>
  /\b\d+%|\b\d+\+|\b\d+\s*years?|\b3\+\s*years/i.test(plain);

function checkExperience(
  text: string,
  isLatex: boolean,
  plain: string,
  issues: AtsIssue[],
  sectionIssues: Record<string, number>
) {
  let count = 0;
  const expBullets = extractExperienceBullets(text, isLatex).filter((b) => {
    const p = b.includes("\\") ? stripLatexInline(b) : b.toLowerCase();
    return p.length > 20;
  });

  const withoutMetric = expBullets.filter((b) => !bulletHasMetric(b));
  if (withoutMetric.length > 0) {
    const ratio = expBullets.length > 0 ? withoutMetric.length / expBullets.length : 0;
    count += ratio >= 0.5 ? 2 : 1;
    issues.push({
      section: "Experience",
      severity: "error",
      message: `${withoutMetric.length} experience bullet(s) lack measurable results`,
      suggestion:
        "Add numbers to each bullet: %, team size, time saved, users served, bug reduction",
    });
  }

  const weakMatches = plain.match(WEAK_VERBS);
  if (weakMatches && weakMatches.length > 0) {
    count += Math.min(weakMatches.length, 3);
    issues.push({
      section: "Experience",
      severity: "warning",
      message: "Weak phrasing detected (responsible for, worked on, helped)",
      suggestion: "Replace with action verbs: Led, Built, Owned, Delivered",
    });
  }

  if (count === 0 && expBullets.length > 0) {
    issues.push({
      section: "Experience",
      severity: "good",
      message: "Experience bullets use metrics and strong verbs",
    });
  }

  sectionIssues.Experience = count;
}

function checkSkills(text: string, isLatex: boolean, plain: string, issues: AtsIssue[], sectionIssues: Record<string, number>) {
  let count = 0;
  const hasSkillsSection =
    /technical skills|skills/i.test(plain) ||
    (isLatex && text.includes("\\section{Technical Skills}"));

  if (!hasSkillsSection) {
    count += 2;
    issues.push({
      section: "Skills",
      severity: "error",
      message: "Technical Skills section missing or incomplete",
      suggestion: "Group skills: Languages, Frontend, Backend, Databases, Tools",
    });
  } else if (isLatex) {
    const categories = (text.match(/\\textbf\{[^}]+\}\{:/g) || []).length;
    if (categories < 3) {
      count += 2;
      issues.push({
        section: "Skills",
        severity: "warning",
        message: "Skills not grouped into enough categories",
        suggestion: "Use at least 4 categories with JD-relevant skills listed first",
      });
    } else {
      issues.push({
        section: "Skills",
        severity: "good",
        message: "Skills section is categorized",
      });
    }
  }

  sectionIssues.Skills = count;
}

function checkEducation(plain: string, issues: AtsIssue[], sectionIssues: Record<string, number>) {
  let count = 0;
  if (!/education|bachelor|master|b\.?tech|mca|bca|degree/i.test(plain)) {
    count += 2;
    issues.push({
      section: "Education",
      severity: "warning",
      message: "Education section may be incomplete",
      suggestion: "Include degree, institution, dates, and GPA if strong",
    });
  } else if (!/\bgpa\b|\bcgpa\b|\d\.\d+\s*(?:cgpa|gpa)/i.test(plain)) {
    count += 1;
    issues.push({
      section: "Education",
      severity: "warning",
      message: "GPA not found in education section",
      suggestion: "Add GPA/CGPA if 7.5+ to strengthen candidacy",
    });
  } else {
    issues.push({
      section: "Education",
      severity: "good",
      message: "Education section present",
    });
  }
  sectionIssues.Education = count;
}

function checkTailoring(resumeText: string, jobDescription: string, issues: AtsIssue[]) {
  if (!jobDescription || jobDescription.length < 20) {
    issues.push({
      section: "Tailoring",
      severity: "error",
      message: "No job description provided for tailoring",
      suggestion: "Paste a job description to optimize keywords and match score",
    });
    return;
  }

  const match = calculateMatchScore(jobDescription, resumeText);
  if (match < 50) {
    issues.push({
      section: "Tailoring",
      severity: "warning",
      message: `Low JD keyword match (${match}%)`,
      suggestion: "Inject more exact skills and terms from the job description",
    });
  } else if (match < 70) {
    issues.push({
      section: "Tailoring",
      severity: "warning",
      message: `Moderate JD keyword match (${match}%)`,
      suggestion: "Add more JD keywords to summary, skills, and experience bullets",
    });
  } else {
    issues.push({
      section: "Tailoring",
      severity: "good",
      message: `Strong JD keyword alignment (${match}%)`,
    });
  }
}

export function analyzeResume(
  text: string,
  isLatex?: boolean,
  jobDescription = ""
): ResumeAnalysis {
  const resolvedLatex = isLatex ?? isLatexSource(text);
  const plain = resumeToPlainText(text, resolvedLatex);
  const issues: AtsIssue[] = [];
  const sectionIssues: Record<string, number> = {};

  checkContact(plain, issues, sectionIssues);
  checkSummary(plain, resolvedLatex, text, issues, sectionIssues);
  checkExperience(text, resolvedLatex, plain, issues, sectionIssues);
  checkSkills(text, resolvedLatex, plain, issues, sectionIssues);
  checkEducation(plain, issues, sectionIssues);
  checkTailoring(text, jobDescription, issues);

  const expBullets = extractExperienceBullets(text, resolvedLatex).filter((b) => {
    const p = b.includes("\\") ? stripLatexInline(b) : b;
    return p.length > 20;
  });
  const expWithMetrics = expBullets.filter((b) => bulletHasMetric(b)).length;
  const experienceMeasurablePercent =
    expBullets.length > 0 ? Math.round((expWithMetrics / expBullets.length) * 100) : 100;
  const bulletsMissingMetrics = expBullets
    .filter((b) => !bulletHasMetric(b))
    .map((b) => (b.includes("\\") ? stripLatexInline(b) : b).slice(0, 200));

  const allBullets = extractBullets(text, resolvedLatex);
  const withMetrics = allBullets.filter((b) => bulletHasMetric(b)).length;
  const measurablePercent =
    allBullets.length > 0 ? Math.round((withMetrics / allBullets.length) * 100) : 100;

  const repetitionWarnings = detectRepetition(plain);

  for (const rep of repetitionWarnings) {
    issues.push({
      section: "Content",
      severity: "warning",
      message: `Word "${rep.word}" repeated ${rep.count} times`,
      suggestion: `Try: ${rep.alternatives.join(", ")}`,
    });
  }
  if (repetitionWarnings.length > 0) {
    sectionIssues.Content = Math.min(3, repetitionWarnings.length);
  }

  const issueCount = issues.filter((i) => i.severity !== "good").length;

  const keywordMatch = jobDescription ? calculateMatchScore(jobDescription, text) : 50;

  const preliminaryScore = Math.min(
    100,
    Math.round(
      measurablePercent * 0.25 +
        keywordMatch * 0.3 +
        Math.max(0, 100 - issueCount * 4)
    )
  );

  return {
    score: preliminaryScore,
    grade: scoreToGrade(preliminaryScore),
    issueCount,
    sectionIssues,
    issues,
    measurablePercent,
    experienceMeasurablePercent,
    bulletsMissingMetrics,
    repetitionWarnings,
    categoryScores: {
      content: 0,
      sections: 0,
      atsEssentials: 0,
      tailoring: jobDescription.trim().length >= 20 ? keywordMatch : null,
      measurable: experienceMeasurablePercent,
      repetition: Math.max(
        0,
        100 -
          repetitionWarnings.reduce((s, w) => s + Math.max(0, w.count - 2) * 12, 0)
      ),
    },
  };
}
