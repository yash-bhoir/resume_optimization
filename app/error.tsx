"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app/error]", error);

    const message = error.message || "";
    if (
      message.includes("ChunkLoadError") ||
      message.includes("Loading chunk")
    ) {
      const key = "resume_optimizer_chunk_reload";
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, "1");
        window.location.reload();
      }
    }
  }, [error]);

  return (
    <div className="error-page">
      <h1>Something went wrong</h1>
      <p>
        We couldn&apos;t load this page. Try again, or start a new optimization from the home page.
      </p>
      <div className="error-page-actions">
        <button type="button" className="btn btn-primary" onClick={() => reset()}>
          Try again
        </button>
        <Link href="/" className="btn btn-secondary">
          Back to home
        </Link>
      </div>
    </div>
  );
}
