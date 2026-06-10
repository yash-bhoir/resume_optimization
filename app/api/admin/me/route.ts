import { requireAdmin } from "@/lib/admin";
import { jsonOk } from "@/lib/api-response";

export async function GET() {
  const admin = await requireAdmin();
  if (admin.error) return admin.error;

  return jsonOk({
    admin: true,
    email: admin.email,
    userId: admin.userId,
  });
}
