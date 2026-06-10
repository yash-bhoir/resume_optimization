"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function AdminDeniedBanner() {
  const searchParams = useSearchParams();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (searchParams.get("admin") !== "denied") return;
    setVisible(true);
    const url = new URL(window.location.href);
    url.searchParams.delete("admin");
    window.history.replaceState({}, "", url.pathname + url.search);
  }, [searchParams]);

  if (!visible) return null;

  return (
    <div className="admin-denied-banner" role="alert">
      <strong>Admin access denied.</strong> Sign in with the email configured in{" "}
      <code>ADMIN_EMAILS</code>, then open{" "}
      <Link href="/admin">/admin</Link> again.
    </div>
  );
}
