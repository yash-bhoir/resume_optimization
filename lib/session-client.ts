import { v4 as uuidv4 } from "uuid";
import type { AtsBreakdown, ChangeItem, ResumeAnalysis } from "@/types";

const KEYS = {
  sessionId: "resume_optimizer_session_id",
  session: "resume_optimizer_session",
  jobDescription: "resume_optimizer_job_description",
} as const;

export interface StoredSessionPayload {
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
  analysisBefore?: ResumeAnalysis;
  analysisAfter?: ResumeAnalysis;
  detectedFormat?: string;
  updatedAt?: number;
  /** @deprecated use matchScoreAfter */
  matchScore?: number;
}

function migrateAnalysis(
  analysis: ResumeAnalysis | undefined,
  fallback: ResumeAnalysis
): ResumeAnalysis {
  if (!analysis) return fallback;
  return {
    ...analysis,
    categoryScores: analysis.categoryScores ?? fallback.categoryScores,
  };
}

function migrateSession(raw: Record<string, unknown>): StoredSessionPayload {
  const matchAfter = (raw.matchScoreAfter as number) ?? (raw.matchScore as number) ?? 0;
  const emptyBreakdown: AtsBreakdown = {
    keywordScore: 0,
    skillsScore: 0,
    structureScore: 0,
    parseScore: 0,
    measurableScore: 0,
    contentScore: 0,
  };

  const emptyAnalysis: ResumeAnalysis = {
    score: 0,
    grade: "NEEDS WORK",
    issueCount: 0,
    sectionIssues: {},
    issues: [],
    measurablePercent: 0,
    repetitionWarnings: [],
    categoryScores: {
      content: 0,
      sections: 0,
      atsEssentials: 0,
      tailoring: null,
      measurable: 0,
      repetition: 0,
    },
  };

  return {
    sessionId: (raw.sessionId as string) || uuidv4(),
    rawText: (raw.rawText as string) || "",
    jobDescription: (raw.jobDescription as string) || "",
    latexSource: (raw.latexSource as string) || "",
    matchScoreBefore: (raw.matchScoreBefore as number) ?? 0,
    matchScoreAfter: matchAfter,
    atsScoreBefore: (raw.atsScoreBefore as number) ?? 0,
    atsScoreAfter: (raw.atsScoreAfter as number) ?? matchAfter,
    optimizationGain: (raw.optimizationGain as number) ?? 0,
    optimizationPercent: (raw.optimizationPercent as number) ?? 0,
    atsBreakdownBefore: (raw.atsBreakdownBefore as AtsBreakdown) ?? emptyBreakdown,
    atsBreakdownAfter: (raw.atsBreakdownAfter as AtsBreakdown) ?? emptyBreakdown,
    changeLog: (raw.changeLog as string[]) ?? [],
    changeItems: (raw.changeItems as ChangeItem[]) ?? [],
    pageFit: (raw.pageFit as number) ?? 100,
    pageCount: (raw.pageCount as number) ?? 1,
    analysisBefore: migrateAnalysis(raw.analysisBefore as ResumeAnalysis | undefined, emptyAnalysis),
    analysisAfter: migrateAnalysis(raw.analysisAfter as ResumeAnalysis | undefined, emptyAnalysis),
    detectedFormat: raw.detectedFormat as string | undefined,
    updatedAt: raw.updatedAt as number | undefined,
  };
}

export function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return uuidv4();
  let id = localStorage.getItem(KEYS.sessionId);
  if (!id) {
    id = uuidv4();
    localStorage.setItem(KEYS.sessionId, id);
  }
  return id;
}

export function saveJobDescriptionDraft(jobDescription: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEYS.jobDescription, jobDescription);
}

export function loadJobDescriptionDraft(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(KEYS.jobDescription) || "";
}

export function saveSessionToStorage(data: Omit<StoredSessionPayload, "sessionId" | "updatedAt">): void {
  if (typeof window === "undefined") return;
  const payload: StoredSessionPayload = {
    ...data,
    sessionId: getOrCreateSessionId(),
    updatedAt: Date.now(),
  };
  localStorage.setItem(KEYS.session, JSON.stringify(payload));
}

export function loadSessionFromStorage(): StoredSessionPayload | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(KEYS.session);
  if (!raw) return null;
  try {
    return migrateSession(JSON.parse(raw) as Record<string, unknown>);
  } catch {
    return null;
  }
}

export function updateSessionInStorage(partial: Partial<StoredSessionPayload>): void {
  const current = loadSessionFromStorage();
  if (!current) return;
  saveSessionToStorage({ ...current, ...partial });
}

export function clearSessionStorage(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEYS.session);
  localStorage.removeItem(KEYS.jobDescription);
  localStorage.removeItem(KEYS.sessionId);
}
