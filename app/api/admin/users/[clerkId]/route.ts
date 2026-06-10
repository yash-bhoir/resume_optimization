import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { updateUserByAdmin } from "@/lib/admin-users";
import { adminUserPatchSchema } from "@/lib/schemas-admin";
import { jsonError, jsonOk, jsonValidationError } from "@/lib/api-response";
import { requireJsonContentType } from "@/lib/request-guards";
import { getRouteContext, withRouteLogging } from "@/lib/api-route";
import { logger } from "@/lib/logger";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ clerkId: string }> }
) {
  try {
    const admin = await requireAdmin();
    if (admin.error) return admin.error;

    const { clerkId } = await params;
    if (!clerkId || clerkId.length > 128) {
      return jsonError("Invalid user id", "INVALID_USER", 400);
    }

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

      const parsed = adminUserPatchSchema.safeParse(body);
      if (!parsed.success) {
        const fields: Record<string, string> = {};
        for (const issue of parsed.error.issues) {
          fields[issue.path.join(".") || "body"] = issue.message;
        }
        return jsonValidationError(fields);
      }

      const updated = await updateUserByAdmin(clerkId, parsed.data);
      if (!updated) {
        return jsonError("User not found", "NOT_FOUND", 404);
      }

      logger.info(
        { adminEmail: admin.email, targetClerkId: clerkId, patch: parsed.data },
        "Admin updated user"
      );

      return jsonOk({
        user: {
          clerkId: updated.clerkId,
          email: updated.email,
          plan: updated.plan,
          creditsBalance: updated.creditsBalance ?? 0,
          creditsUsedThisMonth: updated.creditsUsedThisMonth ?? 0,
          optimizationsThisMonth: updated.optimizationsThisMonth ?? 0,
        },
      });
    });
  } catch (err) {
    logger.error({ err }, "Admin user patch failed");
    const message = err instanceof Error ? err.message : "Update failed";
    return jsonError(message, "ADMIN_UPDATE_FAILED", 500);
  }
}
