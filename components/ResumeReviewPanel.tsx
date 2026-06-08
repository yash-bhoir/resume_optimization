"use client";

import { countResumeElements } from "@/lib/resume-text";
import type { DetectedFormat } from "@/types";

interface ResumeReviewPanelProps {
  rawText: string;
  detectedFormat?: DetectedFormat | null;
  confirmed: boolean;
  onConfirm: () => void;
  onEdit: () => void;
}

export default function ResumeReviewPanel({
  rawText,
  detectedFormat,
  confirmed,
  onConfirm,
  onEdit,
}: ResumeReviewPanelProps) {
  const stats = countResumeElements(rawText, false);

  return (
    <div className="panel review-panel">
      <div className="panel-header-row">
        <div>
          <h2 className="panel-title">Review parsed resume</h2>
          <p className="panel-desc">Confirm everything looks correct before optimizing</p>
        </div>
        <span className="panel-icon" aria-hidden>✓</span>
      </div>

      <p className="review-hint">
        We read your full resume first. Optimization strengthens ATS match and adds JD keywords —
        it will not remove jobs, projects, or skills.
      </p>

      <div className="review-stats">
        <div className="stat-chip">
          <span className="stat-value">{stats.charCount.toLocaleString()}</span>
          <span className="stat-label">Characters</span>
        </div>
        {stats.jobCount > 0 && (
          <div className="stat-chip">
            <span className="stat-value">{stats.jobCount}</span>
            <span className="stat-label">Roles</span>
          </div>
        )}
        {stats.projectCount > 0 && (
          <div className="stat-chip">
            <span className="stat-value">{stats.projectCount}</span>
            <span className="stat-label">Projects</span>
          </div>
        )}
        {stats.bulletCount > 0 && (
          <div className="stat-chip">
            <span className="stat-value">{stats.bulletCount}</span>
            <span className="stat-label">Bullets</span>
          </div>
        )}
        {detectedFormat && (
          <div className="stat-chip">
            <span className="stat-value">{detectedFormat.toUpperCase()}</span>
            <span className="stat-label">Format</span>
          </div>
        )}
      </div>

      <div className="document-view review-document">{rawText}</div>

      <div className="review-actions">
        {!confirmed ? (
          <button className="btn btn-primary" onClick={onConfirm}>
            Looks complete — continue
          </button>
        ) : (
          <>
            <span className="badge success">Resume confirmed</span>
            <button className="btn btn-secondary btn-sm" onClick={onEdit}>
              Re-upload
            </button>
          </>
        )}
      </div>
    </div>
  );
}
