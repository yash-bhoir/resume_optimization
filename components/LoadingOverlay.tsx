"use client";

interface LoadingOverlayProps {
  title: string;
  subtitle?: string;
}

export default function LoadingOverlay({ title, subtitle }: LoadingOverlayProps) {
  return (
    <div className="loading-overlay" role="alert" aria-busy="true">
      <div className="loading-card">
        <div className="loading-spinner" aria-hidden />
        <p className="loading-title">{title}</p>
        {subtitle && <p className="loading-subtitle">{subtitle}</p>}
      </div>
    </div>
  );
}
