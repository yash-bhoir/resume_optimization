import type { NextRequest } from "next/server";
import { jsonError } from "./api-response";

export function requireJsonContentType(request: NextRequest) {
  const contentType = request.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    return jsonError("Content-Type must be application/json", "INVALID_CONTENT_TYPE", 415);
  }
  return null;
}

export function stripMongoOperators<T extends Record<string, unknown>>(obj: T): T {
  const clean = {} as T;
  for (const [key, value] of Object.entries(obj)) {
    if (key.startsWith("$") || key.includes(".")) continue;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      clean[key as keyof T] = stripMongoOperators(value as Record<string, unknown>) as T[keyof T];
    } else {
      clean[key as keyof T] = value as T[keyof T];
    }
  }
  return clean;
}
