export type DetectedFormat = "pdf" | "docx" | "txt" | "tex" | "image" | "unknown";

export type OptimizationMode = "preserve" | "template";

/** How to adjust resume length after optimization. */
export type PageLayoutMode = "balanced" | "single_page" | "fill_page";

export type { ResumeDocument } from "@/types/resume-document";

export interface ParseResumeResponse {
  rawText: string;
  detectedFormat: DetectedFormat;
}

export interface AtsBreakdown {
  keywordScore: number;
  skillsScore: number;
  structureScore: number;
  parseScore: number;
  measurableScore: number;
  contentScore: number;
  jdCoveragePercent?: number;
  jdKeywordsMatched?: number;
  jdKeywordsTotal?: number;
}

export interface AtsIssue {
  section: string;
  severity: "error" | "warning" | "good";
  message: string;
  suggestion?: string;
}

export interface CategoryScores {
  content: number;
  sections: number;
  atsEssentials: number;
  tailoring: number | null;
  measurable: number;
  repetition: number;
}

export interface ChecklistItem {
  id: string;
  label: string;
  pass: boolean;
  tip?: string;
  critical?: boolean;
}

export interface ResumeAnalysis {
  score: number;
  grade: "EXCELLENT" | "GOOD" | "FAIR" | "NEEDS WORK";
  issueCount: number;
  sectionIssues: Record<string, number>;
  issues: AtsIssue[];
  measurablePercent: number;
  experienceMeasurablePercent: number;
  bulletsMissingMetrics: string[];
  repetitionWarnings: { word: string; count: number; alternatives: string[] }[];
  categoryScores: CategoryScores;
}

export interface ChangeItem {
  section: string;
  type: "added" | "removed" | "modified";
  before?: string;
  after?: string;
  summary: string;
}

export interface OptimizeResponse {
  latexSource: string;
  matchScoreBefore: number;
  matchScoreAfter: number;
  atsScoreBefore: number;
  atsScoreAfter: number;
  optimizationGain: number;
  optimizationPercent: number;
  atsBreakdownBefore: AtsBreakdown;
  atsBreakdownAfter: AtsBreakdown;
  changeLog: string[];
  changeItems: ChangeItem[];
  pageFit: number;
  pageCount: number;
  analysisBefore: ResumeAnalysis;
  analysisAfter: ResumeAnalysis;
  sessionId: string;
}

export interface ApiError {
  error: string;
  code: string;
}

export interface SessionData {
  sessionId: string;
  rawText: string;
  jobDescription: string;
  latexSource: string;
  matchScoreBefore: number;
  matchScoreAfter: number;
  atsScoreBefore: number;
  atsScoreAfter: number;
  optimizationGain: number;
  optimizationPercent: number;
  atsBreakdownBefore: AtsBreakdown;
  atsBreakdownAfter: AtsBreakdown;
  changeLog: string[];
  changeItems: ChangeItem[];
  pageFit: number;
  pageCount: number;
  detectedFormat: DetectedFormat;
  createdAt: Date;
  updatedAt: Date;
}

export type OptimizeStep =
  | "idle"
  | "parsing"
  | "optimizing"
  | "rendering"
  | "page-fit"
  | "done"
  | "error";
