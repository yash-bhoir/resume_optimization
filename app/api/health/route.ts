import { jsonOk } from "@/lib/api-response";

export async function GET() {
  return jsonOk({ status: "ok", service: "resume-optimizer" });
}
