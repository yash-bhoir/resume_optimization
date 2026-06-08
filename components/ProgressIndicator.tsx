"use client";

import type { OptimizeStep } from "@/types";

interface ProgressIndicatorProps {
  step: OptimizeStep;
}

const STEPS = [
  { key: "parsing", label: "Parse resume" },
  { key: "review", label: "Review" },
  { key: "optimizing", label: "Optimize" },
  { key: "rendering", label: "Results" },
] as const;

function getProgress(step: OptimizeStep): number {
  switch (step) {
    case "parsing":
      return 20;
    case "review":
      return 40;
    case "optimizing":
      return 70;
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
      return "Reading your complete resume...";
    case "review":
      return "Review your resume before optimizing...";
    case "optimizing":
      return "Optimizing for job description...";
    case "rendering":
      return "Preparing results...";
    case "done":
      return "Complete!";
    default:
      return "";
  }
}

export default function ProgressIndicator({ step }: ProgressIndicatorProps) {
  if (step === "idle" || step === "error") return null;

  const progress = getProgress(step);
  const currentIdx = STEPS.findIndex((s) => s.key === step);

  return (
    <div className="progress">
      <div className="progress-label">{getLabel(step)}</div>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>
      <div className="progress-steps">
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
