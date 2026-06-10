import mongoose, { Schema, model, models } from "mongoose";

export interface IGlobalStats {
  key: "global";
  totalOptimizationsLifetime: number;
  totalKeywordGainSum: number;
  updatedAt: Date;
}

const GlobalStatsSchema = new Schema<IGlobalStats>(
  {
    key: { type: String, required: true, unique: true, default: "global" },
    totalOptimizationsLifetime: { type: Number, default: 0, min: 0 },
    totalKeywordGainSum: { type: Number, default: 0, min: 0 },
  },
  { timestamps: { createdAt: false, updatedAt: true } }
);

export const GlobalStats =
  models.GlobalStats || model<IGlobalStats>("GlobalStats", GlobalStatsSchema);

export async function incrementGlobalOptimizationStats(keywordGain: number): Promise<void> {
  await GlobalStats.findOneAndUpdate(
    { key: "global" },
    {
      $inc: {
        totalOptimizationsLifetime: 1,
        totalKeywordGainSum: Math.max(0, keywordGain),
      },
    },
    { upsert: true }
  );
}
