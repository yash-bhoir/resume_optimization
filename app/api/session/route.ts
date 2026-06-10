import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Session, ensureSessionIndexes, type ISession } from "@/lib/models/Session";
import { requireAuth } from "@/lib/auth";
import { sessionPostSchema } from "@/lib/schemas";
import { validateRequest } from "@/lib/validate";
import { parseSessionData } from "@/lib/session-fields";
import { getRouteContext, withRouteLogging } from "@/lib/api-route";
import { requireJsonContentType } from "@/lib/request-guards";
import { jsonError, jsonOk, jsonValidationError } from "@/lib/api-response";
import { toSafeClientMessage } from "@/lib/safe-error";

export async function POST(request: NextRequest) {
  const authResult = await requireAuth();
  if (authResult.error) return authResult.error;

  const ctx = getRouteContext(request, authResult.userId);

  return withRouteLogging(ctx, async () => {
    try {
      const contentTypeError = requireJsonContentType(request);
      if (contentTypeError) return contentTypeError;

      const body = await request.json();
      const parsed = validateRequest(sessionPostSchema, body);
      if (!parsed.success) {
        return jsonValidationError(parsed.fields);
      }

      const { sessionId, data } = parsed.data;
      const sessionData = parseSessionData(data);
      if (!sessionData.success) {
        return jsonValidationError(sessionData.fields);
      }

      await connectDB();
      await ensureSessionIndexes();

      await Session.findOneAndUpdate(
        { sessionId, clerkId: authResult.userId },
        {
          $set: {
            ...sessionData.data,
            sessionId,
            clerkId: authResult.userId,
            updatedAt: new Date(),
          },
        },
        { upsert: true, new: true }
      );

      return jsonOk({ saved: true, sessionId });
    } catch (err) {
      return jsonError(
        toSafeClientMessage(err, "Failed to save session"),
        "SESSION_SAVE_FAILED",
        500
      );
    }
  });
}

export async function GET(request: NextRequest) {
  const authResult = await requireAuth();
  if (authResult.error) return authResult.error;

  const ctx = getRouteContext(request, authResult.userId);

  return withRouteLogging(ctx, async () => {
    try {
      const sessionId = request.nextUrl.searchParams.get("sessionId");
      if (!sessionId) {
        return jsonError("sessionId is required", "INVALID_SESSION", 400);
      }

      await connectDB();
      const session = await Session.findOne({
        sessionId,
        clerkId: authResult.userId,
      }).lean<ISession>();

      if (!session) {
        return jsonError("Session not found", "NOT_FOUND", 404);
      }

      return jsonOk({
        rawText: session.rawText,
        jobDescription: session.jobDescription,
        latexSource: session.latexSource,
        matchScore: session.matchScore,
        changeLog: session.changeLog,
        pageFit: session.pageFit,
        detectedFormat: session.detectedFormat,
      });
    } catch (err) {
      return jsonError(
        toSafeClientMessage(err, "Failed to load session"),
        "SESSION_LOAD_FAILED",
        500
      );
    }
  });
}
