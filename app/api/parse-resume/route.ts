import { NextRequest } from "next/server";
import {
  detectFormat,
  parseResumeFile,
  validateUpload,
} from "@/lib/parse-resume";
import { jsonError, jsonOk } from "@/lib/api-response";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return jsonError("No file uploaded", "NO_FILE");
    }

    const validation = validateUpload(file);
    if (!validation.valid) {
      return jsonError(validation.error!, validation.code!);
    }

    const detectedFormat = detectFormat(file);
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const rawText = await parseResumeFile(buffer, detectedFormat);

    if (!rawText || rawText.length < 20) {
      return jsonError(
        "Could not extract enough text from the file. Try a clearer PDF or TXT upload.",
        "PARSE_EMPTY"
      );
    }

    return jsonOk({ rawText, detectedFormat });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to parse resume";
    return jsonError(message, "PARSE_FAILED", 500);
  }
}
