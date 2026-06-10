import type { z } from "zod";
import { logger } from "./logger";

export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; fields: Record<string, string> };

export function validateRequest<T>(schema: z.ZodSchema<T>, body: unknown): ValidationResult<T> {
  const result = schema.safeParse(body);

  if (!result.success) {
    const fields: Record<string, string> = {};
    for (const issue of result.error.issues) {
      const key = issue.path.length > 0 ? issue.path.join(".") : "body";
      if (!fields[key]) {
        fields[key] = issue.message;
      }
    }

    logger.warn({ fields, bodyType: typeof body }, "Request validation failed");

    return {
      success: false,
      error: "Validation failed",
      fields,
    };
  }

  return { success: true, data: result.data };
}

export function firstFieldError(fields: Record<string, string>): string {
  const first = Object.values(fields)[0];
  return first || "Please check your input and try again";
}
