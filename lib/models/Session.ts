import mongoose, { Schema, model, models } from "mongoose";

export interface ISession {
  sessionId: string;
  rawText: string;
  jobDescription: string;
  latexSource: string;
  matchScore: number;
  changeLog: string[];
  pageFit: number;
  detectedFormat: string;
  createdAt: Date;
  updatedAt: Date;
}

const SessionSchema = new Schema<ISession>(
  {
    sessionId: { type: String, required: true, unique: true, index: true },
    rawText: { type: String, default: "" },
    jobDescription: { type: String, default: "" },
    latexSource: { type: String, default: "" },
    matchScore: { type: Number, default: 0 },
    changeLog: { type: [String], default: [] },
    pageFit: { type: Number, default: 100 },
    detectedFormat: { type: String, default: "unknown" },
  },
  { timestamps: true }
);

SessionSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });

export const Session =
  models.Session || model<ISession>("Session", SessionSchema);

export async function ensureSessionIndexes() {
  if (mongoose.connection.readyState === 1) {
    await Session.syncIndexes();
  }
}
