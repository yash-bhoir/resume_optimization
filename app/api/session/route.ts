import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Session, ensureSessionIndexes, type ISession } from "@/lib/models/Session";
import { jsonError, jsonOk } from "@/lib/api-response";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, data } = body;

    if (!sessionId || typeof sessionId !== "string") {
      return jsonError("sessionId is required", "INVALID_SESSION");
    }

    await connectDB();
    await ensureSessionIndexes();

    await Session.findOneAndUpdate(
      { sessionId },
      { $set: { sessionId, ...data, updatedAt: new Date() } },
      { upsert: true, new: true }
    );

    return jsonOk({ saved: true, sessionId });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to save session";
    return jsonError(message, "SESSION_SAVE_FAILED", 500);
  }
}

export async function GET(request: NextRequest) {
  try {
    const sessionId = request.nextUrl.searchParams.get("sessionId");
    if (!sessionId) {
      return jsonError("sessionId is required", "INVALID_SESSION");
    }

    await connectDB();
    const session = await Session.findOne({ sessionId }).lean<ISession>();

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
    const message = err instanceof Error ? err.message : "Failed to load session";
    return jsonError(message, "SESSION_LOAD_FAILED", 500);
  }
}
