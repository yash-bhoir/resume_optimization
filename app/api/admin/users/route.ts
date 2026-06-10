import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { listUsersForAdmin } from "@/lib/admin-users";
import { jsonOk } from "@/lib/api-response";
import { getRouteContext, withRouteLogging } from "@/lib/api-route";

export async function GET(request: NextRequest) {
  const admin = await requireAdmin();
  if (admin.error) return admin.error;

  const ctx = getRouteContext(request, admin.userId);

  return withRouteLogging(ctx, async () => {
    const { searchParams } = request.nextUrl;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "20", 10);
    const search = searchParams.get("search") || undefined;
    const plan = (searchParams.get("plan") || "all") as "free" | "pro" | "all";

    const result = await listUsersForAdmin({ page, pageSize, search, plan });
    return jsonOk(result);
  });
}
