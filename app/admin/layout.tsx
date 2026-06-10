import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { checkIsAdmin } from "@/lib/admin";

export const metadata: Metadata = {
  title: "Admin — Resume Optimizer",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in?redirect_url=" + encodeURIComponent("/admin"));
  }

  const isAdmin = await checkIsAdmin();
  if (!isAdmin) {
    redirect("/?admin=denied");
  }

  return <div className="admin-shell">{children}</div>;
}
