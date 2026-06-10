import mongoose, { Schema, model, models } from "mongoose";
import type { AtsBreakdown, ChangeItem, OptimizationMode } from "@/types";
import type { ResumeAnalysis } from "@/types";
import type { ResumeDocument } from "@/types/resume-document";

export interface IOptimizationHistory {
  _id?: mongoose.Types.ObjectId;
  clerkId: string;
  sessionId: string;
  originalFileName?: string;
  detectedFormat?: string;
  optimizationMode?: OptimizationMode;
  effectiveMode?: OptimizationMode;
  layoutNote?: string;
  jobDescriptionSnippet: string;
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
  createdAt: Date;
  updatedAt: Date;
}

const OptimizationHistorySchema = new Schema<IOptimizationHistory>(
  {
    clerkId: { type: String, required: true, index: true },
    sessionId: { type: String, required: true, index: true },
    originalFileName: { type: String, default: "" },
    detectedFormat: { type: String, default: "unknown" },
    optimizationMode: { type: String, enum: ["template", "preserve"], default: "template" },
    effectiveMode: { type: String, enum: ["template", "preserve"], default: "template" },
    layoutNote: { type: String, default: "" },
    jobDescriptionSnippet: { type: String, default: "", maxlength: 300 },
    rawText: { type: String, default: "" },
    jobDescription: { type: String, default: "" },
    latexSource: { type: String, default: "" },
    matchScoreBefore: { type: Number, default: 0 },
    matchScoreAfter: { type: Number, default: 0 },
    atsScoreBefore: { type: Number, default: 0 },
    atsScoreAfter: { type: Number, default: 0 },
    optimizationGain: { type: Number, default: 0 },
    optimizationPercent: { type: Number, default: 0 },
    atsBreakdownBefore: { type: Schema.Types.Mixed },
    atsBreakdownAfter: { type: Schema.Types.Mixed },
    changeLog: { type: [String], default: [] },
    changeItems: { type: Schema.Types.Mixed, default: [] },
    pageFit: { type: Number, default: 100 },
    pageCount: { type: Number, default: 1 },
    analysisBefore: { type: Schema.Types.Mixed },
    analysisAfter: { type: Schema.Types.Mixed },
    resumeDocument: { type: Schema.Types.Mixed },
    preservedTexSource: { type: String, default: "" },
    originalFileBase64: { type: String, default: "" },
    preservedDocxBase64: { type: String, default: "" },
  },
  { timestamps: true }
);

OptimizationHistorySchema.index({ clerkId: 1, createdAt: -1 });

export const OptimizationHistory =
  models.OptimizationHistory ||
  model<IOptimizationHistory>("OptimizationHistory", OptimizationHistorySchema);

export async function ensureOptimizationHistoryIndexes() {
  if (mongoose.connection.readyState === 1) {
    await OptimizationHistory.syncIndexes();
  }
}
