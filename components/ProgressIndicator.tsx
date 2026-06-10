"use client";

import type { OptimizeStep } from "@/types";

interface ProgressIndicatorProps {
  step: OptimizeStep;
}

const STEPS = [
  { key: "parsing", label: "Read resume" },
  { key: "optimizing", label: "Tailor content" },
  { key: "rendering", label: "Prepare results" },
] as const;

function getProgress(step: OptimizeStep): number {
  switch (step) {
    case "parsing":
      return 25;
    case "optimizing":
      return 65;
    case "rendering":
      return 90;
    case "done":
      return 100;
    default:
      return 0;
  }
}

function getLabel(step: OptimizeStep): string {
  switch (step) {
    case "parsing":
      return "Reading your resume…";
    case "optimizing":
      return "Tailoring content to the job description…";
    case "rendering":
      return "Preparing your results…";
    case "done":
      return "Resume optimized";
    default:
      return "";
  }
}

export default function ProgressIndicator({ step }: ProgressIndicatorProps) {
  if (step === "idle" || step === "error") return null;

  const progress = getProgress(step);
  const currentIdx = STEPS.findIndex((s) => s.key === step);

  return (
    <div className="progress" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
      <div className="progress-label">{getLabel(step)}</div>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>
      <div className="progress-steps" aria-hidden>
        {STEPS.map((s, i) => (
          <span
            key={s.key}
            className={
              i <= (currentIdx >= 0 ? currentIdx : STEPS.length - 1)
                ? "active"
                : ""
            }
          >
            {s.label}
          </span>
        ))}
      </div>
    </div>
  );
}
