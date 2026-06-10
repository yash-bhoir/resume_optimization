import { z } from "zod";
import { LIMITS } from "./constants";

const noScriptTags = (val: string) => !/<script[\s>]/i.test(val);

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export const jobDescriptionSchema = z
  .string()
  .trim()
  .min(LIMITS.JD_MIN_CHARS, "Please paste the full job description (at least 50 characters)")
  .max(LIMITS.JD_MAX_CHARS, "Job description too long — please trim to 20,000 characters")
  .refine((val) => wordCount(val) >= LIMITS.JD_MIN_WORDS, {
    message: "Job description must contain at least 10 words",
  })
  .refine((val) => /[a-zA-Z0-9]/.test(val), {
    message: "Job description must contain readable text",
  })
  .refine(noScriptTags, { message: "Job description contains invalid content" });

export const resumeTextSchema = z
  .string()
  .trim()
  .min(LIMITS.RESUME_MIN_CHARS, "Could not extract enough text from your resume")
  .max(LIMITS.RESUME_MAX_CHARS, "Resume text exceeds maximum length")
  .refine(noScriptTags, { message: "Resume text contains invalid content" });

export const scorePreviewSchema = z.object({
  resumeText: resumeTextSchema,
  jobDescription: jobDescriptionSchema,
});

export const optimizeRequestSchema = z.object({
  resumeText: resumeTextSchema,
  jobDescription: jobDescriptionSchema,
  optimizationMode: z.enum(["template", "preserve"]).optional().default("template"),
  detectedFormat: z.enum(["pdf", "docx", "image"]).optional().default("pdf"),
  originalFileBase64: z.string().max(7_500_000).optional(),
  originalTexSource: z.string().max(200_000).optional(),
  originalFileName: z.string().max(LIMITS.FILENAME_MAX).optional(),
  sessionId: z.string().uuid().optional(),
  resumeDocument: z.unknown().optional(),
});

export const latexExportSchema = z.object({
  latexSource: z.string().min(1).max(200_000).refine(noScriptTags, {
    message: "Invalid resume content",
  }),
});

export const docxPreserveSchema = z.object({
  preservedDocxBase64: z.string().min(1).max(7_500_000),
});

export const texExportSchema = z.object({
  latexSource: z.string().min(1).max(200_000),
  format: z.enum(["tex", "txt"]).optional().default("tex"),
});

export const sessionPostSchema = z.object({
  sessionId: z.string().uuid(),
  data: z.record(z.string(), z.unknown()).optional().default({}),
});
