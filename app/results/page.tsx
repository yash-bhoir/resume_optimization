"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AppHeader from "@/components/AppHeader";
import OptimizedResumePanel from "@/components/OptimizedResumePanel";
import ScoreDashboard from "@/components/ScoreDashboard";
import ResumeDiffPanel from "@/components/ResumeDiffPanel";
import ChangeLogPanel from "@/components/ChangeLogPanel";
import ATSReportPanel from "@/components/ATSReportPanel";
import CategoryScorePanel from "@/components/CategoryScorePanel";
import PreDownloadChecklist from "@/components/PreDownloadChecklist";
import LoadingOverlay from "@/components/LoadingOverlay";
import {
  loadSessionFromStorage,
  updateSessionInStorage,
  type StoredSessionPayload,
} from "@/lib/session-client";

export default function ResultsPage() {
  const router = useRouter();
  const [data, setData] = useState<StoredSessionPayload | null>(null);
  const [editMode, setEditMode] = useState(true);
  const [pageCount, setPageCount] = useState(1);
  const [showDiff, setShowDiff] = useState(true);
  const [viewMode, setViewMode] = useState<"formatted" | "diff">("formatted");

  useEffect(() => {
    const stored = loadSessionFromStorage();
    if (!stored) {
      router.replace("/");
      return;
    }
    setData(stored);
    setPageCount(stored.pageCount || 1);
  }, [router]);

  if (!data) {
    return <LoadingOverlay title="Loading your results" />;
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

  return (
    <div className="app-shell results-page">
      <AppHeader showBack backLabel="New optimization" />

      <div className="results-content">
        <div className="results-sidebar">
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

          {data.analysisBefore?.categoryScores && data.analysisAfter?.categoryScores && (
            <CategoryScorePanel
              before={data.analysisBefore.categoryScores}
              after={data.analysisAfter.categoryScores}
            />
          )}

          {data.analysisBefore && data.analysisAfter && (
            <PreDownloadChecklist
              analysisBefore={data.analysisBefore}
              analysisAfter={data.analysisAfter}
              keywordMatch={data.matchScoreAfter}
              hasJobDescription={data.jobDescription.trim().length >= 20}
            />
          )}

          {data.analysisBefore && data.analysisAfter && (
            <ATSReportPanel before={data.analysisBefore} after={data.analysisAfter} />
          )}

          <ChangeLogPanel items={data.changeItems || []} summaries={data.changeLog} />
        </div>

        <div className="results-tabs" role="tablist">
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
            aria-selected={viewMode === "diff"}
            className={`tab-btn ${viewMode === "diff" ? "active" : ""}`}
            onClick={() => setViewMode("diff")}
          >
            Compare changes
          </button>
          {viewMode === "diff" && (
            <label className="diff-toggle">
              <input
                type="checkbox"
                checked={showDiff}
                onChange={(e) => setShowDiff(e.target.checked)}
              />
              Highlight changes
            </label>
          )}
        </div>

        {viewMode === "formatted" ? (
          <div className="comparison-grid single">
            <OptimizedResumePanel
              latexSource={data.latexSource}
              editMode={editMode}
              onEditModeChange={setEditMode}
              onLatexChange={handleLatexChange}
              onPageFitChange={handlePageFitChange}
              jobDescription={data.jobDescription}
              onReoptimize={() => router.push("/")}
            />
          </div>
        ) : (
          <ResumeDiffPanel
            originalText={data.rawText}
            optimizedLatex={data.latexSource}
            showDiff={showDiff}
          />
        )}
      </div>

      <footer className="app-footer">
        Scores are estimates — always review before submitting applications
      </footer>
    </div>
  );
}
