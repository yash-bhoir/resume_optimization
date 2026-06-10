"use client";

interface LoadingOverlayProps {
  title: string;
  subtitle?: string;
  /** Updates while the overlay is open (e.g. elapsed-time hints). */
  progressHint?: string;
}

export default function LoadingOverlay({ title, subtitle, progressHint }: LoadingOverlayProps) {
  return (
    <div className="loading-overlay" role="status" aria-live="polite" aria-busy="true">
      <div className="loading-card">
        <div className="loading-skeleton" aria-hidden>
          <div className="skeleton skeleton-line" style={{ width: "85%" }} />
          <div className="skeleton skeleton-line" style={{ width: "100%" }} />
          <div className="skeleton skeleton-line" style={{ width: "60%" }} />
        </div>
        <p className="loading-title">{title}</p>
        {progressHint ? (
          <p className="loading-subtitle loading-progress-hint">{progressHint}</p>
        ) : subtitle ? (
          <p className="loading-subtitle">{subtitle}</p>
        ) : null}
      </div>
    </div>
  );
}
