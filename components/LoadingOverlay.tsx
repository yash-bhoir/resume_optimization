"use client";

interface LoadingOverlayProps {
  title: string;
  subtitle?: string;
  /** Updates while the overlay is open (e.g. elapsed-time hints). */
  progressHint?: string;
}

export default function LoadingOverlay({ title, subtitle, progressHint }: LoadingOverlayProps) {
  const statusText = progressHint ?? subtitle;

  return (
    <div className="loading-overlay" role="status" aria-live="polite" aria-busy="true">
      <div className="loading-card">
        <div className="loading-card-header">
          <div className="loading-spinner-ring" aria-hidden="true" />
          <div className="loading-card-heading">
            <p className="loading-title">{title}</p>
            {statusText ? (
              <p key={statusText} className="loading-subtitle loading-progress-hint">
                {statusText}
                <span className="loading-dots" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </span>
              </p>
            ) : null}
          </div>
        </div>

        <div className="loading-progress-track" aria-hidden="true">
          <div className="loading-progress-indeterminate" />
        </div>

        <div className="loading-doc-preview" aria-hidden="true">
          <div className="loading-doc-header">
            <div className="skeleton loading-doc-avatar" />
            <div className="loading-doc-meta">
              <div className="skeleton skeleton-line loading-doc-line-lg" />
              <div className="skeleton skeleton-line loading-doc-line-sm" />
            </div>
          </div>
          <div className="skeleton skeleton-line" style={{ width: "42%" }} />
          <div className="skeleton skeleton-line" style={{ width: "100%" }} />
          <div className="skeleton skeleton-line" style={{ width: "92%" }} />
          <div className="skeleton skeleton-line" style={{ width: "78%" }} />
          <div className="skeleton skeleton-line loading-doc-line-fade" style={{ width: "55%" }} />
        </div>
      </div>
    </div>
  );
}
