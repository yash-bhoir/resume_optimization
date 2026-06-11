"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import AppHeader from "@/components/AppHeader";
import OptimizedResumePanel from "@/components/OptimizedResumePanel";
import ScoreDashboard from "@/components/ScoreDashboard";
import ChangeLogPanel from "@/components/ChangeLogPanel";
import ATSReportPanel from "@/components/ATSReportPanel";
import CategoryScorePanel from "@/components/CategoryScorePanel";
import PreDownloadChecklist from "@/components/PreDownloadChecklist";
import QuantifyImpactPanel from "@/components/QuantifyImpactPanel";
import LoginWall from "@/components/LoginWall";
import LoadingOverlay from "@/components/LoadingOverlay";
import dynamic from "next/dynamic";
import UsageCounter from "@/components/UsageCounter";
import ReoptimizePanel from "@/components/ReoptimizePanel";
import { useCreditUsage } from "@/hooks/useCreditUsage";
import {
  loadSessionFromStorageAsync,
  loadHistoryById,
  updateSessionInStorage,
  type StoredSessionPayload,
} from "@/lib/session-client";

const MissingKeywordsPanel = dynamic(() => import("@/components/MissingKeywordsPanel"), {
  ssr: false,
});

const ResumeCompareView = dynamic(() => import("@/components/ResumeCompareView"), {
  loading: () => (
    <LoadingOverlay title="Loading comparison" subtitle="Preparing side-by-side view" />
  ),
  ssr: false,
});

export default function ResultsPage() {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useAuth();
  const { isPro } = useCreditUsage();
  const isGuest = isLoaded && !isSignedIn;

  const [data, setData] = useState<StoredSessionPayload | null>(null);
  const [archivedNote, setArchivedNote] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [pageCount, setPageCount] = useState(1);
  const [viewMode, setViewMode] = useState<"formatted" | "compare">("formatted");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      let stored = await loadSessionFromStorageAsync();
      if (cancelled) return;

      const historyId =
        typeof window !== "undefined"
          ? new URLSearchParams(window.location.search).get("history")
          : null;

      if (!stored && historyId && isSignedIn) {
        stored = await loadHistoryById(historyId);
        if (stored && !stored.originalFileBase64 && !stored.preservedDocxBase64) {
          setArchivedNote(
            "Opened from history — original file preview unavailable. Re-upload to compare layouts."
          );
        }
      }

      if (!stored) {
        router.replace(isSignedIn ? "/history" : "/");
        return;
      }
      setData(stored);
      setPageCount(stored.pageCount || 1);
    })();
    return () => {
      cancelled = true;
    };
  }, [router, isSignedIn]);

  if (!data) {
    return <LoadingOverlay title="Loading your results" subtitle="Retrieving your optimized resume" />;
  }

  const handleLatexChange = (latexSource: string) => {
    const updated = { ...data, latexSource };
    setData(updated);
    updateSessionInStorage({ latexSource });
  };

  const handlePageFitChange = (fit: number, pages?: number) => {
    if (pages) setPageCount(pages);
    updateSessionInStorage({ pageFit: fit, pageCount: pages || pageCount });
  };

  const handleReflowComplete = (payload: {
    latexSource: string;
    pageCount: number;
    resumeDocument?: StoredSessionPayload["resumeDocument"];
    preservedDocxBase64?: string;
  }) => {
    const updated = {
      ...data,
      latexSource: payload.latexSource,
      pageCount: payload.pageCount,
      ...(payload.resumeDocument ? { resumeDocument: payload.resumeDocument } : {}),
      ...(payload.preservedDocxBase64
        ? { preservedDocxBase64: payload.preservedDocxBase64 }
        : {}),
    };
    setData(updated);
    setPageCount(payload.pageCount);
    updateSessionInStorage({
      latexSource: payload.latexSource,
      pageCount: payload.pageCount,
      ...(payload.resumeDocument ? { resumeDocument: payload.resumeDocument } : {}),
      ...(payload.preservedDocxBase64
        ? { preservedDocxBase64: payload.preservedDocxBase64 }
        : {}),
    });
  };

  const compareData = {
    rawText: data.rawText,
    latexSource: data.latexSource,
    detectedFormat: data.detectedFormat,
    originalFileName: data.originalFileName,
    originalFileBase64: data.originalFileBase64,
    originalTexSource: data.originalTexSource,
    effectiveMode: data.effectiveMode,
    preservedDocxBase64: data.preservedDocxBase64,
  };

  return (
    <div className="app-shell results-page">
      <AppHeader showBack backLabel="New optimization" />

      <div className="results-content">
        <UsageCounter />

        {archivedNote && (
          <div className="warning-banner" role="status">
            {archivedNote}
          </div>
        )}

        <div className="results-layout">
          <div className="results-analysis">
            <ScoreDashboard
              matchScoreBefore={data.matchScoreBefore}
              matchScoreAfter={data.matchScoreAfter}
              atsScoreBefore={data.atsScoreBefore}
              atsScoreAfter={data.atsScoreAfter}
              optimizationGain={data.optimizationGain}
              optimizationPercent={data.optimizationPercent}
              atsBreakdownBefore={data.atsBreakdownBefore}
              atsBreakdownAfter={data.atsBreakdownAfter}
              pageCount={pageCount}
            />

            <div className={`gated-section ${isGuest ? "gated-blur" : ""}`}>
              {data.analysisBefore?.categoryScores && data.analysisAfter?.categoryScores && (
                <CategoryScorePanel
                  before={data.analysisBefore.categoryScores}
                  after={data.analysisAfter.categoryScores}
                />
              )}

              {data.analysisBefore && data.analysisAfter && (
                <QuantifyImpactPanel before={data.analysisBefore} after={data.analysisAfter} />
              )}

              {data.analysisBefore && data.analysisAfter && (
                <PreDownloadChecklist
                  analysisBefore={data.analysisBefore}
                  analysisAfter={data.analysisAfter}
                  keywordMatch={data.matchScoreAfter}
                  hasJobDescription={data.jobDescription.trim().length >= 50}
                />
              )}

              {data.analysisBefore && data.analysisAfter && (
                <ATSReportPanel before={data.analysisBefore} after={data.analysisAfter} />
              )}

              <ChangeLogPanel items={data.changeItems || []} summaries={data.changeLog} />

              {!isGuest && (
                <MissingKeywordsPanel
                  jobDescription={data.jobDescription}
                  optimizedText={data.latexSource}
                  matchScoreAfter={data.matchScoreAfter}
                />
              )}

              {!isGuest && (
                <div id="reoptimize-section">
                  <ReoptimizePanel
                    session={data}
                    isPro={isPro}
                    onComplete={(updated) => {
                      setData(updated);
                      setPageCount(updated.pageCount || 1);
                      setArchivedNote(null);
                    }}
                  />
                </div>
              )}

              {isGuest && <LoginWall feature="optimization" />}
            </div>
          </div>

          <div className="results-resume-column">
            <div className="results-resume-tabs" role="tablist" aria-label="Resume view">
              <button
                role="tab"
                aria-selected={viewMode === "formatted"}
                className={`tab-btn ${viewMode === "formatted" ? "active" : ""}`}
                onClick={() => setViewMode("formatted")}
              >
                Optimized resume
              </button>
              <button
                role="tab"
                aria-selected={viewMode === "compare"}
                className={`tab-btn ${viewMode === "compare" ? "active" : ""} ${isGuest ? "locked-tab" : ""}`}
                onClick={() => setViewMode("compare")}
                title={isGuest ? "Sign in to compare side by side" : undefined}
              >
                Side-by-side
              </button>
              {viewMode === "compare" && !isGuest && (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm compare-open-btn"
                  onClick={() => router.push("/compare")}
                >
                  Full-page compare
                </button>
              )}
            </div>

            <div className={`gated-section ${isGuest ? "gated-blur" : ""}`}>
              {viewMode === "formatted" ? (
                <div className="comparison-grid single">
                  <OptimizedResumePanel
                    latexSource={data.latexSource}
                    editMode={editMode && !isGuest}
                    onEditModeChange={setEditMode}
                    onLatexChange={handleLatexChange}
                    onPageFitChange={handlePageFitChange}
                    jobDescription={data.jobDescription}
                    onReoptimize={() => {
                      document.getElementById("reoptimize-section")?.scrollIntoView({ behavior: "smooth" });
                    }}
                    effectiveMode={data.effectiveMode}
                    preservedDocxBase64={data.preservedDocxBase64}
                    preservedTexSource={data.preservedTexSource}
                    layoutNote={data.layoutNote}
                    originalFileName={data.originalFileName}
                    pageCount={pageCount}
                    resumeDocument={data.resumeDocument}
                    rawText={data.rawText}
                    onReflowComplete={handleReflowComplete}
                  />
                </div>
              ) : (
                <ResumeCompareView data={compareData} />
              )}

              {isGuest && (
                <LoginWall
                  feature={viewMode === "compare" ? "diff" : "optimization"}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      <footer className="app-footer">
        Scores are estimates — review your resume before submitting applications
      </footer>
    </div>
  );
}
