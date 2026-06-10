import { auth, currentUser } from "@clerk/nextjs/server";
import { jsonError } from "./api-errors";

function getAdminEmails(): string[] {
  const raw =
    process.env.ADMIN_EMAILS?.trim() ||
    process.env.ADMIN_EMAIL?.trim() ||
    "yash51217@gmail.com";

  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export async function isAdminEmail(email: string | null | undefined): Promise<boolean> {
  if (!email) return false;
  return getAdminEmails().includes(email.trim().toLowerCase());
}

export async function requireAdmin() {
  const { userId } = await auth();
  if (!userId) {
    return {
      userId: null as null,
      email: null as null,
      error: jsonError("Admin sign-in required", "UNAUTHORIZED", 401),
    };
  }

  const user = await currentUser();
  const email =
    user?.primaryEmailAddress?.emailAddress ||
    user?.emailAddresses?.[0]?.emailAddress ||
    null;

  if (!(await isAdminEmail(email))) {
    return {
      userId: null as null,
      email: null as null,
      error: jsonError("Forbidden — admin access only", "FORBIDDEN", 403),
    };
  }

  return { userId, email: email!, error: null };
}

export async function checkIsAdmin(): Promise<boolean> {
  const { userId } = await auth();
  if (!userId) return false;
  const user = await currentUser();
  const email =
    user?.primaryEmailAddress?.emailAddress ||
    user?.emailAddresses?.[0]?.emailAddress;
  return isAdminEmail(email);
}
