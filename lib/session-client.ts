import { v4 as uuidv4 } from "uuid";
import type { AtsBreakdown, ChangeItem, OptimizationMode, ResumeAnalysis } from "@/types";
import type { ResumeDocument } from "@/types/resume-document";
import {
  saveSessionBinary,
  loadSessionBinary,
  clearSessionBinary,
  saveOriginalUploadFile,
  type SessionBinary,
} from "./session-binary";

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
  optimizationMode?: OptimizationMode;
  effectiveMode?: OptimizationMode;
  layoutNote?: string;
  preservedDocxBase64?: string;
  preservedTexSource?: string;
  resumeDocument?: ResumeDocument;
  originalFileBase64?: string;
  originalFileName?: string;
  originalTexSource?: string;
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
    experienceMeasurablePercent:
      analysis.experienceMeasurablePercent ?? analysis.measurablePercent ?? 0,
    bulletsMissingMetrics: analysis.bulletsMissingMetrics ?? [],
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
    experienceMeasurablePercent: 0,
    bulletsMissingMetrics: [],
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
    optimizationMode: (raw.optimizationMode as OptimizationMode) ?? "template",
    effectiveMode: (raw.effectiveMode as OptimizationMode) ?? "template",
    layoutNote: raw.layoutNote as string | undefined,
    preservedDocxBase64: raw.preservedDocxBase64 as string | undefined,
    preservedTexSource: raw.preservedTexSource as string | undefined,
    resumeDocument: raw.resumeDocument as ResumeDocument | undefined,
    originalFileBase64: raw.originalFileBase64 as string | undefined,
    originalFileName: raw.originalFileName as string | undefined,
    originalTexSource: raw.originalTexSource as string | undefined,
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

export async function saveSessionToStorage(
  data: Omit<StoredSessionPayload, "sessionId" | "updatedAt">,
  originalFile?: File | null
): Promise<void> {
  if (typeof window === "undefined") return;

  if (originalFile) {
    await saveOriginalUploadFile(originalFile);
    await saveSessionBinary({
      originalFileName: data.originalFileName || originalFile.name,
      preservedDocxBase64: data.preservedDocxBase64,
      preservedTexSource: data.preservedTexSource,
    });
  } else {
    await saveSessionBinary({
      originalFileBase64: data.originalFileBase64,
      originalFileName: data.originalFileName,
      preservedDocxBase64: data.preservedDocxBase64,
      preservedTexSource: data.preservedTexSource,
    });
  }

  const { originalFileBase64: _o, preservedDocxBase64: _p, ...rest } = data;
  const payload: StoredSessionPayload = {
    ...rest,
    sessionId: getOrCreateSessionId(),
    updatedAt: Date.now(),
  };
  localStorage.setItem(KEYS.session, JSON.stringify(payload));
}

/** @deprecated Use saveSessionToStorage (async) */
export function saveSessionToStorageSync(
  data: Omit<StoredSessionPayload, "sessionId" | "updatedAt">
): void {
  void saveSessionToStorage(data);
}

export async function loadSessionBinaryData(): Promise<SessionBinary> {
  return loadSessionBinary();
}

export async function persistSessionToServer(
  data: Omit<StoredSessionPayload, "sessionId" | "updatedAt">
): Promise<void> {
  const sessionId = getOrCreateSessionId();
  await fetch("/api/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionId,
      data: {
        rawText: data.rawText,
        jobDescription: data.jobDescription,
        latexSource: data.latexSource,
        matchScore: data.matchScoreAfter,
        changeLog: data.changeLog,
        pageFit: data.pageFit,
        detectedFormat: data.detectedFormat,
      },
    }),
  });
}

function loadLegacyBinaryFromSessionStorage(): SessionBinary {
  if (typeof window === "undefined") return {};
  try {
    const raw = sessionStorage.getItem("resume_optimizer_binary");
    if (raw) return JSON.parse(raw) as SessionBinary;
  } catch {
    /* ignore */
  }
  return {};
}

export function loadSessionFromStorage(): StoredSessionPayload | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(KEYS.session);
  if (!raw) return null;
  try {
    const session = migrateSession(JSON.parse(raw) as Record<string, unknown>);
    const binary = loadLegacyBinaryFromSessionStorage();
    return { ...session, ...binary };
  } catch {
    return null;
  }
}

export async function loadSessionFromStorageAsync(): Promise<StoredSessionPayload | null> {
  const session = loadSessionFromStorage();
  if (!session) return null;
  const binary = await loadSessionBinary();
  return {
    ...session,
    originalFileName: binary.originalFileName || session.originalFileName,
    originalFileBase64: binary.originalFileBase64 || session.originalFileBase64,
    preservedDocxBase64: binary.preservedDocxBase64 || session.preservedDocxBase64,
    preservedTexSource: binary.preservedTexSource || session.preservedTexSource,
  };
}

export function updateSessionInStorage(partial: Partial<StoredSessionPayload>): void {
  const current = loadSessionFromStorage();
  if (!current) return;
  void saveSessionToStorage({ ...current, ...partial });
}

export async function restoreSessionFromHistory(
  history: Record<string, unknown>
): Promise<StoredSessionPayload> {
  const payload: Omit<StoredSessionPayload, "sessionId" | "updatedAt"> = {
    rawText: (history.rawText as string) || "",
    jobDescription: (history.jobDescription as string) || "",
    latexSource: (history.latexSource as string) || "",
    matchScoreBefore: (history.matchScoreBefore as number) ?? 0,
    matchScoreAfter: (history.matchScoreAfter as number) ?? 0,
    atsScoreBefore: (history.atsScoreBefore as number) ?? 0,
    atsScoreAfter: (history.atsScoreAfter as number) ?? 0,
    optimizationGain: (history.optimizationGain as number) ?? 0,
    optimizationPercent: (history.optimizationPercent as number) ?? 0,
    atsBreakdownBefore: history.atsBreakdownBefore as StoredSessionPayload["atsBreakdownBefore"],
    atsBreakdownAfter: history.atsBreakdownAfter as StoredSessionPayload["atsBreakdownAfter"],
    changeLog: (history.changeLog as string[]) ?? [],
    changeItems: (history.changeItems as StoredSessionPayload["changeItems"]) ?? [],
    pageFit: (history.pageFit as number) ?? 100,
    pageCount: (history.pageCount as number) ?? 1,
    analysisBefore: history.analysisBefore as StoredSessionPayload["analysisBefore"],
    analysisAfter: history.analysisAfter as StoredSessionPayload["analysisAfter"],
    detectedFormat: history.detectedFormat as string | undefined,
    optimizationMode: history.optimizationMode as StoredSessionPayload["optimizationMode"],
    effectiveMode: history.effectiveMode as StoredSessionPayload["effectiveMode"],
    layoutNote: history.layoutNote as string | undefined,
    preservedTexSource: history.preservedTexSource as string | undefined,
    originalFileBase64: history.originalFileBase64 as string | undefined,
    preservedDocxBase64: history.preservedDocxBase64 as string | undefined,
    resumeDocument: history.resumeDocument as ResumeDocument | undefined,
    originalFileName: history.originalFileName as string | undefined,
  };

  await saveSessionBinary({
    originalFileBase64: payload.originalFileBase64,
    originalFileName: payload.originalFileName,
    preservedDocxBase64: payload.preservedDocxBase64,
    preservedTexSource: payload.preservedTexSource,
  }).catch(() => {});

  await saveSessionToStorage({ ...payload });
  const restored = await loadSessionFromStorageAsync();
  if (!restored) {
    throw new Error("Failed to restore session");
  }
  return restored;
}

export async function loadHistoryById(id: string): Promise<StoredSessionPayload | null> {
  const res = await fetch(`/api/history/${id}`, { credentials: "same-origin" });
  if (!res.ok) return null;
  const data = await res.json();
  if (!data || data.error) return null;
  return restoreSessionFromHistory(data);
}

export { saveOriginalUploadFile } from "./session-binary";

export function clearSessionStorage(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEYS.session);
  localStorage.removeItem(KEYS.jobDescription);
  localStorage.removeItem(KEYS.sessionId);
  void clearSessionBinary();
  try {
    sessionStorage.removeItem("resume_optimizer_binary");
  } catch {
    /* ignore */
  }
}
