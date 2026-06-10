import type { OptimizationMode } from "@/types";

export interface HistoryListItem {
  id: string;
  originalFileName: string;
  jobDescriptionSnippet: string;
  matchScoreBefore: number;
  matchScoreAfter: number;
  atsScoreBefore: number;
  atsScoreAfter: number;
  optimizationMode?: OptimizationMode;
  effectiveMode?: OptimizationMode;
  detectedFormat?: string;
  createdAt: string;
}
