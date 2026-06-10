import type { NextRequest } from "next/server";
import { logger } from "./logger";
import { getClientIdentifier } from "./request-client";

export interface RouteLogContext {
  method: string;
  path: string;
  userId?: string | null;
  ip: string;
}

export function getRouteContext(request: NextRequest, userId?: string | null): RouteLogContext {
  return {
    method: request.method,
    path: request.nextUrl.pathname,
    userId: userId ?? null,
    ip: getClientIdentifier(request),
  };
}

export async function withRouteLogging<T>(
  ctx: RouteLogContext,
  handler: () => Promise<T>
): Promise<T> {
  const start = Date.now();
  logger.info({ ...ctx }, "API request");
  try {
    const result = await handler();
    logger.info({ ...ctx, status: "ok", durationMs: Date.now() - start }, "API response");
    return result;
  } catch (err) {
    logger.error(
      { ...ctx, durationMs: Date.now() - start, err },
      "API error"
    );
    throw err;
  }
}
