import { requireAdmin } from "@/lib/admin";
import { getAdminDashboardStats } from "@/lib/admin-users";
import { jsonOk } from "@/lib/api-response";
import { getRouteContext, withRouteLogging } from "@/lib/api-route";

export async function GET(request: Request) {
  const admin = await requireAdmin();
  if (admin.error) return admin.error;

  const ctx = getRouteContext(request as import("next/server").NextRequest, admin.userId);

  return withRouteLogging(ctx, async () => {
    const stats = await getAdminDashboardStats();
    return jsonOk(stats);
  });
}
