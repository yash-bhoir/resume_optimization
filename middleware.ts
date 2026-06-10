import { clerkMiddleware } from "@clerk/nextjs/server";

/**
 * Auth for download/export routes is enforced in each API handler via requireAuth().
 * Middleware only attaches Clerk session context — no auth.protect() here to avoid
 * 404 HTML responses on API fetch calls.
 */
export default clerkMiddleware();

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
