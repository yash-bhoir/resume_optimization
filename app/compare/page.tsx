"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import LoadingOverlay from "@/components/LoadingOverlay";
import { loadSessionFromStorageAsync, type StoredSessionPayload } from "@/lib/session-client";

const ResumeCompareView = dynamic(() => import("@/components/ResumeCompareView"), {
  loading: () => (
    <LoadingOverlay
      title="Loading comparison"
      subtitle="Pulling up your original and optimized resumes"
    />
  ),
  ssr: false,
});

export default function ComparePage() {
  const router = useRouter();
  const [data, setData] = useState<StoredSessionPayload | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const stored = await loadSessionFromStorageAsync();
      if (cancelled) return;
      if (!stored) {
        router.replace("/");
        return;
      }
      setData(stored);
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (!data) {
    return (
      <LoadingOverlay
        title="Loading comparison"
        subtitle="Pulling up your original and optimized resumes"
      />
    );
  }

  return (
    <div className="compare-page-shell">
      <header className="compare-page-header">
        <h1>Resume comparison</h1>
        <p>Side-by-side view of your original and optimized resume.</p>
      </header>
      <ResumeCompareView data={data} fullPage />
    </div>
  );
}
