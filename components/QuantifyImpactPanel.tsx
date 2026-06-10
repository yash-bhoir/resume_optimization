"use client";

import { useState } from "react";
import type { ResumeAnalysis } from "@/types";

interface QuantifyImpactPanelProps {
  before: ResumeAnalysis;
  after: ResumeAnalysis;
}

export default function QuantifyImpactPanel({ before, after }: QuantifyImpactPanelProps) {
  const [expanded, setExpanded] = useState(true);

  const missing = after.bulletsMissingMetrics ?? [];
  const expPercent = after.experienceMeasurablePercent ?? after.measurablePercent;
  const beforeMissing = before.bulletsMissingMetrics?.length ?? 0;
  const fixed = Math.max(0, beforeMissing - missing.length);
  const allPass = missing.length === 0;

  return (
    <div className={`quantify-panel ${allPass ? "all-pass" : ""}`}>
      <button
        type="button"
        className="quantify-header"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
      >
        <div>
          <strong>Quantify impact</strong>
          <span className="quantify-sub">
            {allPass
              ? `Every experience bullet has a metric (${expPercent}%)`
              : `${missing.length} bullet${missing.length === 1 ? "" : "s"} still need numbers · ${expPercent}% covered`}
          </span>
        </div>
        <span className="quantify-badge" aria-hidden>{allPass ? "✓" : "!"}</span>
      </button>

      {expanded && (
        <div className="quantify-body">
          {allPass ? (
            <p className="quantify-ok">
              All experience bullets include measurable results.
              {fixed > 0 && ` We added metrics to ${fixed} bullet${fixed === 1 ? "" : "s"} during optimization.`}
            </p>
          ) : (
            <>
              <p className="quantify-intro">
                Recruiters skim for numbers. Add percentages, team sizes, user counts, or timelines
                to these bullets before you download:
              </p>
              <ol className="quantify-list">
                {missing.map((bullet, i) => (
                  <li key={i} className="quantify-bullet">
                    {bullet}
                  </li>
                ))}
              </ol>
            </>
          )}

          {after.repetitionWarnings.length > 0 && (
            <div className="quantify-repetition">
              <strong>Repeated words to vary</strong>
              <ul>
                {after.repetitionWarnings.map((w) => (
                  <li key={w.word}>
                    &quot;{w.word}&quot; appears {w.count} times — try: {w.alternatives.slice(0, 3).join(", ")}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
