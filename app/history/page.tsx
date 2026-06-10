"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import AppHeader from "@/components/AppHeader";
import Footer from "@/components/Footer";
import LoadingOverlay from "@/components/LoadingOverlay";
import { loadHistoryById } from "@/lib/session-client";
import { formatJobSnippet } from "@/lib/format-snippet";
import type { HistoryListItem } from "@/types/history";

function FileTypeIcon({ format }: { format?: string }) {
  const label = (format || "file").toUpperCase();
  return (
    <div className="history-file-icon" aria-hidden>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" />
        <path d="M14 2v6h6M8 13h8M8 17h5" strokeLinecap="round" />
      </svg>
      <span>{label.slice(0, 4)}</span>
    </div>
  );
}

function formatHistoryDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export default function HistoryPage() {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useAuth();
  const [items, setItems] = useState<HistoryListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      router.replace("/sign-in?redirect_url=/history");
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/history", { credentials: "same-origin" });
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setError(data.error || "Failed to load history");
          return;
        }
        setItems(data.items || []);
        setTotal(data.total || 0);
      } catch {
        if (!cancelled) setError("Failed to load history");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn, router]);

  const handleOpen = async (id: string) => {
    setRestoringId(id);
    setError(null);
    try {
      const session = await loadHistoryById(id);
      if (!session) {
        setError("Could not restore this optimization");
        return;
      }
      router.push("/results");
    } catch {
      setError("Could not restore this optimization");
    } finally {
      setRestoringId(null);
    }
  };

  if (!isLoaded || loading) {
    return (
      <div className="app-shell">
        <AppHeader />
        <LoadingOverlay title="Loading your history" subtitle="Fetching past optimizations" />
      </div>
    );
  }

  return (
    <div className="app-shell">
      <AppHeader showBack backHref="/" backLabel="New optimization" />
      <main className="app-main history-page">
        <header className="history-header">
          <div className="history-header-text">
            <h1>Optimization history</h1>
            <p className="history-subtitle">
              Reopen scores, change logs, and downloads anytime. File previews restore when the
              original upload was saved.
            </p>
          </div>
          {total > 0 && (
            <div className="history-count-badge" role="status">
              <span className="history-count-value">{total}</span>
              <span className="history-count-label">
                saved run{total === 1 ? "" : "s"}
              </span>
            </div>
          )}
        </header>

        {error && (
          <div className="error-banner" role="alert">
            {error}
          </div>
        )}

        {items.length === 0 ? (
          <div className="history-empty">
            <div className="history-empty-icon" aria-hidden>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 8v4l2.5 2.5" strokeLinecap="round" />
              </svg>
            </div>
            <h2>No optimizations yet</h2>
            <p>Your tailored resumes and scores will appear here after you optimize.</p>
            <Link href="/" className="btn btn-primary">
              Optimize your first resume
            </Link>
          </div>
        ) : (
          <ul className="history-list">
            {items.map((item) => {
              const matchGain = item.matchScoreAfter - item.matchScoreBefore;
              const atsGain = item.atsScoreAfter - item.atsScoreBefore;
              const snippet = formatJobSnippet(item.jobDescriptionSnippet);
              const modeLabel =
                item.effectiveMode === "preserve" ? "Layout kept" : "ATS template";

              return (
                <li key={item.id} className="history-card">
                  <FileTypeIcon format={item.detectedFormat} />

                  <div className="history-card-body">
                    <div className="history-card-title-row">
                      <h2 className="history-filename" title={item.originalFileName}>
                        {item.originalFileName}
                      </h2>
                      <div className="history-badges">
                        <span className="history-badge">{item.detectedFormat?.toUpperCase() || "FILE"}</span>
                        <span className={`history-badge ${item.effectiveMode === "preserve" ? "pro" : ""}`}>
                          {modeLabel}
                        </span>
                      </div>
                    </div>

                    {snippet && (
                      <p className="history-jd-snippet" title={snippet}>
                        {snippet}
                      </p>
                    )}

                    <time className="history-meta" dateTime={item.createdAt}>
                      {formatHistoryDate(item.createdAt)}
                    </time>
                  </div>

                  <div className="history-card-aside">
                    <div className="history-score-row">
                      <div className="history-score-chip">
                        <span className="history-score-label">Match</span>
                        <span className="history-score-values">
                          {item.matchScoreBefore}%
                          <span className="history-score-arrow" aria-hidden>→</span>
                          {item.matchScoreAfter}%
                        </span>
                        {matchGain > 0 && (
                          <span className="history-gain-pill">+{matchGain}</span>
                        )}
                      </div>
                      <div className="history-score-chip">
                        <span className="history-score-label">ATS</span>
                        <span className="history-score-values">
                          {item.atsScoreBefore}
                          <span className="history-score-arrow" aria-hidden>→</span>
                          {item.atsScoreAfter}
                        </span>
                        {atsGain > 0 && (
                          <span className="history-gain-pill">+{atsGain}</span>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      className="btn btn-primary btn-sm history-open-btn"
                      onClick={() => handleOpen(item.id)}
                      disabled={restoringId === item.id}
                    >
                      {restoringId === item.id ? "Opening…" : "Open results"}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </main>
      <Footer />
    </div>
  );
}
