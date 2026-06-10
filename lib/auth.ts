import { auth, currentUser } from "@clerk/nextjs/server";
import { jsonError } from "./api-response";
import { ensureUser } from "./models/User";

export async function requireAuth() {
  const { userId } = await auth();
  if (!userId) {
    return { userId: null as null, error: jsonError("Sign in required", "UNAUTHORIZED", 401) };
  }

  try {
    const clerkUser = await currentUser();
    const email =
      clerkUser?.primaryEmailAddress?.emailAddress ||
      clerkUser?.emailAddresses?.[0]?.emailAddress;
    await ensureUser(userId, email);
  } catch {
    /* non-fatal */
  }

  return { userId, error: null };
}

export async function getOptionalUserId(): Promise<string | null> {
  const { userId } = await auth();
  return userId;
}
