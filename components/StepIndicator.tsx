"use client";

interface StepIndicatorProps {
  current: 1 | 2 | 3 | 4;
}

const STEPS = [
  { num: 1, label: "Upload" },
  { num: 2, label: "Review" },
  { num: 3, label: "Job description" },
  { num: 4, label: "Optimize" },
] as const;

export default function StepIndicator({ current }: StepIndicatorProps) {
  return (
    <div className="step-indicator" aria-label={`Step ${current} of 4`}>
      {STEPS.map((step, i) => {
        const done = step.num < current;
        const active = step.num === current;
        return (
          <div key={step.num} className="step-item-wrap">
            <div
              className={`step-item ${done ? "done" : ""} ${active ? "active" : ""}`}
            >
              <span className="step-num">{done ? "✓" : step.num}</span>
              <span className="step-label">{step.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`step-connector ${done ? "done" : ""}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
