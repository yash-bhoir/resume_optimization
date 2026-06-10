import { z } from "zod";
import { LIMITS } from "./constants";

const sessionDataSchema = z
  .object({
    rawText: z.string().max(LIMITS.RESUME_MAX_CHARS).optional(),
    jobDescription: z.string().max(LIMITS.JD_MAX_CHARS).optional(),
    latexSource: z.string().max(200_000).optional(),
    matchScore: z.number().min(0).max(100).optional(),
    changeLog: z.array(z.string().max(500)).max(50).optional(),
    pageFit: z.number().min(0).max(200).optional(),
    detectedFormat: z.enum(["pdf", "docx", "unknown"]).optional(),
  })
  .strict();

export type SessionData = z.infer<typeof sessionDataSchema>;

export function parseSessionData(data: unknown): {
  success: true;
  data: SessionData;
} | {
  success: false;
  fields: Record<string, string>;
} {
  const result = sessionDataSchema.safeParse(data ?? {});
  if (!result.success) {
    const fields: Record<string, string> = {};
    for (const issue of result.error.issues) {
      const key = issue.path.join(".") || "data";
      if (!fields[key]) fields[key] = issue.message;
    }
    return { success: false, fields };
  }
  return { success: true, data: result.data };
}
