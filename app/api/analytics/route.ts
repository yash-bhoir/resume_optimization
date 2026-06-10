import { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/lib/api-response";
import { getClientIdentifier } from "@/lib/request-client";
import { rateLimitAnalytics } from "@/lib/rate-limit";
import { getRouteContext, withRouteLogging } from "@/lib/api-route";
import { requireJsonContentType } from "@/lib/request-guards";
import { z } from "zod";

const eventSchema = z.object({
  event: z.enum([
    "page_view",
    "resume_uploaded",
    "optimization_started",
    "optimization_completed",
    "pdf_downloaded",
    "upgrade_clicked",
    "signup_started",
  ]),
  path: z.string().max(500).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(request: NextRequest) {
  const identifier = getClientIdentifier(request);
  const ctx = getRouteContext(request);

  return withRouteLogging(ctx, async () => {
    try {
      const rate = await rateLimitAnalytics(identifier);
      if (!rate.success) {
        return jsonError("Too many requests", "RATE_LIMITED", 429);
      }

      const contentTypeError = requireJsonContentType(request);
      if (contentTypeError) return contentTypeError;

      const body = await request.json();
      const parsed = eventSchema.safeParse(body);

      if (!parsed.success) {
        return jsonError("Invalid event payload", "INVALID_EVENT", 400);
      }

      if (process.env.NODE_ENV === "development") {
        console.info("[analytics]", parsed.data);
      }

      return jsonOk({ received: true });
    } catch {
      return jsonError("Failed to record event", "ANALYTICS_FAILED", 500);
    }
  });
}
