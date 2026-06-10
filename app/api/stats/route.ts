import { NextRequest } from "next/server";
import { getPublicStats } from "@/lib/stats";
import { jsonError, jsonOk } from "@/lib/api-response";
import { getClientIdentifier } from "@/lib/request-client";
import { rateLimitStats } from "@/lib/rate-limit";
import { getRouteContext, withRouteLogging } from "@/lib/api-route";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const identifier = getClientIdentifier(request);
  const ctx = getRouteContext(request);

  return withRouteLogging(ctx, async () => {
    const rate = await rateLimitStats(identifier);
    if (!rate.success) {
      return jsonError("Too many requests", "RATE_LIMITED", 429);
    }

    const stats = await getPublicStats();
    return jsonOk(stats);
  });
}
