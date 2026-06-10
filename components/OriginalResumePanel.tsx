"use client";

interface OriginalResumePanelProps {
  rawText: string;
}

export default function OriginalResumePanel({ rawText }: OriginalResumePanelProps) {
  return (
    <div className="compare-panel">
      <div className="panel-header">Your original resume</div>
      <div className="panel-body">
        <div className="document-view">{rawText}</div>
      </div>
    </div>
  );
}
