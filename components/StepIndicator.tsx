"use client";

interface StepIndicatorProps {
  current: 1 | 2 | 3;
}

const STEPS = [
  { num: 1, label: "Upload resume" },
  { num: 2, label: "Add job description" },
  { num: 3, label: "Review & download" },
] as const;

export default function StepIndicator({ current }: StepIndicatorProps) {
  return (
    <div className="step-indicator" aria-label={`Step ${current} of 3`} role="list">
      {STEPS.map((step, i) => {
        const done = step.num < current;
        const active = step.num === current;
        return (
          <div key={step.num} className="step-item-wrap" role="listitem">
            <div
              className={`step-item ${done ? "done" : ""} ${active ? "active" : ""}`}
              aria-current={active ? "step" : undefined}
            >
              <span className="step-marker" aria-hidden />
              <span className="step-label">{step.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`step-connector ${done ? "done" : ""}`} aria-hidden />
            )}
          </div>
        );
      })}
    </div>
  );
}
