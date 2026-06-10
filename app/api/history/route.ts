import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { listOptimizationHistory } from "@/lib/optimization-history";
import { getRouteContext, withRouteLogging } from "@/lib/api-route";
import { jsonError, jsonOk } from "@/lib/api-response";
import { toSafeClientMessage } from "@/lib/safe-error";

export async function GET(request: NextRequest) {
  const authResult = await requireAuth();
  if (authResult.error) return authResult.error;

  const ctx = getRouteContext(request, authResult.userId);

  return withRouteLogging(ctx, async () => {
    try {
      const limit = Math.min(
        50,
        Math.max(1, parseInt(request.nextUrl.searchParams.get("limit") || "20", 10) || 20)
      );
      const offset = Math.max(
        0,
        parseInt(request.nextUrl.searchParams.get("offset") || "0", 10) || 0
      );

      const result = await listOptimizationHistory(authResult.userId, limit, offset);
      return jsonOk(result);
    } catch (err) {
      return jsonError(
        toSafeClientMessage(err, "Failed to load history"),
        "HISTORY_LIST_FAILED",
        500
      );
    }
  });
}
