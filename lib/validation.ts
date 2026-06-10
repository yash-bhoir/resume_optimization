// Re-export from schemas for backward compatibility
export {
  optimizeRequestSchema,
  latexExportSchema,
  docxPreserveSchema,
  texExportSchema,
  sessionPostSchema,
  scorePreviewSchema,
  jobDescriptionSchema,
  resumeTextSchema,
} from "./schemas";

export { validateRequest, firstFieldError } from "./validate";
export type { ValidationResult } from "./validate";

export function maxUploadBytes(): number {
  return 5 * 1024 * 1024;
}
