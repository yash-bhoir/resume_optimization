import { z } from "zod";
import { jobDescriptionSchema } from "./schemas";

export const reflowRequestSchema = z.object({
  resumeDocument: z.unknown(),
  originalDocument: z.unknown().optional(),
  rawText: z.string().max(200_000).optional(),
  jobDescription: jobDescriptionSchema,
  pageLayout: z.enum(["single_page", "fill_page"]),
  optimizationMode: z.enum(["template", "preserve"]).optional().default("template"),
  detectedFormat: z.enum(["pdf", "docx", "image"]).optional().default("pdf"),
  originalFileBase64: z.string().max(7_500_000).optional(),
  originalTexSource: z.string().max(200_000).optional(),
});
