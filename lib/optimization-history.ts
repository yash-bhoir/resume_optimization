import { connectDB } from "./mongodb";
import {
  OptimizationHistory,
  ensureOptimizationHistoryIndexes,
  type IOptimizationHistory,
} from "./models/OptimizationHistory";
import { incrementGlobalOptimizationStats } from "./models/GlobalStats";
import type { ResumeDocument } from "@/types/resume-document";
import type { AtsBreakdown, ChangeItem, OptimizationMode } from "@/types";
import type { ResumeAnalysis } from "@/types";
import { formatJobSnippet } from "./format-snippet";
import type { HistoryListItem } from "@/types/history";

export interface SaveOptimizationInput {
  clerkId: string;
  sessionId: string;
  originalFileName?: string;
  detectedFormat?: string;
  optimizationMode?: OptimizationMode;
  effectiveMode?: OptimizationMode;
  layoutNote?: string;
  rawText: string;
  jobDescription: string;
  latexSource: string;
  matchScoreBefore: number;
  matchScoreAfter: number;
  atsScoreBefore: number;
  atsScoreAfter: number;
  optimizationGain: number;
  optimizationPercent: number;
  atsBreakdownBefore?: AtsBreakdown;
  atsBreakdownAfter?: AtsBreakdown;
  changeLog: string[];
  changeItems: ChangeItem[];
  pageFit: number;
  pageCount: number;
  analysisBefore?: ResumeAnalysis;
  analysisAfter?: ResumeAnalysis;
  resumeDocument?: ResumeDocument;
  preservedTexSource?: string;
  originalFileBase64?: string;
  preservedDocxBase64?: string;
}

const MAX_STORED_BASE64 = 6_500_000;

function trimBase64(value?: string): string | undefined {
  if (!value || value.length > MAX_STORED_BASE64) return undefined;
  return value;
}

export async function saveOptimizationHistory(
  input: SaveOptimizationInput
): Promise<string> {
  await connectDB();
  await ensureOptimizationHistoryIndexes();

  const snippet = formatJobSnippet(input.jobDescription.trim(), 300);

  const doc = await OptimizationHistory.create({
    ...input,
    originalFileBase64: trimBase64(input.originalFileBase64) ?? "",
    preservedDocxBase64: trimBase64(input.preservedDocxBase64) ?? "",
    jobDescriptionSnippet: snippet,
  });

  const keywordGain = input.matchScoreAfter - input.matchScoreBefore;
  await incrementGlobalOptimizationStats(keywordGain).catch(() => {});

  return String(doc._id);
}

export type { HistoryListItem };

export async function listOptimizationHistory(
  clerkId: string,
  limit = 20,
  offset = 0
): Promise<{ items: HistoryListItem[]; total: number }> {
  await connectDB();
  await ensureOptimizationHistoryIndexes();

  const [items, total] = await Promise.all([
    OptimizationHistory.find({ clerkId })
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .select(
        "originalFileName jobDescriptionSnippet matchScoreBefore matchScoreAfter atsScoreBefore atsScoreAfter optimizationMode effectiveMode detectedFormat createdAt"
      )
      .lean<IOptimizationHistory[]>(),
    OptimizationHistory.countDocuments({ clerkId }),
  ]);

  return {
    total,
    items: items.map((row) => ({
      id: String((row as IOptimizationHistory & { _id: unknown })._id),
      originalFileName: row.originalFileName || "Resume",
      jobDescriptionSnippet: row.jobDescriptionSnippet,
      matchScoreBefore: row.matchScoreBefore,
      matchScoreAfter: row.matchScoreAfter,
      atsScoreBefore: row.atsScoreBefore,
      atsScoreAfter: row.atsScoreAfter,
      optimizationMode: row.optimizationMode,
      effectiveMode: row.effectiveMode,
      detectedFormat: row.detectedFormat,
      createdAt: row.createdAt.toISOString(),
    })),
  };
}

export async function getOptimizationHistory(
  clerkId: string,
  id: string
): Promise<IOptimizationHistory | null> {
  await connectDB();
  return OptimizationHistory.findOne({ _id: id, clerkId }).lean<IOptimizationHistory>();
}
