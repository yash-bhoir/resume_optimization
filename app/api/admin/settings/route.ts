import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { getPricingSettings, updatePricingSettings } from "@/lib/app-settings";
import { adminSettingsPatchSchema } from "@/lib/schemas-admin";
import { jsonError, jsonOk, jsonValidationError } from "@/lib/api-response";
import { requireJsonContentType } from "@/lib/request-guards";
import { getRouteContext, withRouteLogging } from "@/lib/api-route";
import { logger } from "@/lib/logger";

export async function GET() {
  const admin = await requireAdmin();
  if (admin.error) return admin.error;

  const settings = await getPricingSettings();
  return jsonOk({ settings });
}

export async function PUT(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (admin.error) return admin.error;

    const ctx = getRouteContext(request, admin.userId);

    return await withRouteLogging(ctx, async () => {
      const contentTypeError = requireJsonContentType(request);
      if (contentTypeError) return contentTypeError;

      let body: unknown;
      try {
        body = await request.json();
      } catch {
        return jsonError("Invalid JSON body", "INVALID_JSON", 400);
      }

      const parsed = adminSettingsPatchSchema.safeParse(body);
      if (!parsed.success) {
        const fields: Record<string, string> = {};
        for (const issue of parsed.error.issues) {
          fields[issue.path.join(".") || "body"] = issue.message;
        }
        return jsonValidationError(fields);
      }

      const settings = await updatePricingSettings(parsed.data, admin.email!);

      logger.info({ adminEmail: admin.email, patch: parsed.data }, "Admin updated pricing settings");

      return jsonOk({ settings });
    });
  } catch (err) {
    logger.error({ err }, "Admin settings update failed");
    const message = err instanceof Error ? err.message : "Failed to save settings";
    return jsonError(message, "ADMIN_SETTINGS_FAILED", 500);
  }
}
