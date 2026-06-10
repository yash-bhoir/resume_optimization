"use client";

import { useMemo } from "react";
import { analyzeKeywordCoverage } from "@/lib/keyword-coverage";

interface MissingKeywordsPanelProps {
  jobDescription: string;
  optimizedText: string;
  matchScoreAfter: number;
}

export default function MissingKeywordsPanel({
  jobDescription,
  optimizedText,
  matchScoreAfter,
}: MissingKeywordsPanelProps) {
  const coverage = useMemo(
    () => analyzeKeywordCoverage(jobDescription, optimizedText),
    [jobDescription, optimizedText]
  );

  if (coverage.total === 0) return null;

  return (
    <section className="keyword-coverage-panel" aria-labelledby="keyword-coverage-heading">
      <h3 id="keyword-coverage-heading">Job keyword coverage</h3>
      <p className="keyword-coverage-summary">
        <strong>{coverage.matched.length}</strong> of <strong>{coverage.total}</strong> priority
        keywords from the job description appear in your optimized resume ({coverage.percent}%).
        {matchScoreAfter >= 85 && coverage.missing.length > 0 && (
          <> Scores are estimates — review missing terms below.</>
        )}
      </p>

      {coverage.matched.length > 0 && (
        <div className="keyword-chip-group">
          <span className="keyword-chip-label">Matched</span>
          <ul className="keyword-chips matched">
            {coverage.matched.slice(0, 24).map((kw) => (
              <li key={kw}>{kw}</li>
            ))}
          </ul>
        </div>
      )}

      {coverage.missing.length > 0 && (
        <div className="keyword-chip-group">
          <span className="keyword-chip-label">Still missing — add only if truthful</span>
          <ul className="keyword-chips missing">
            {coverage.missing.slice(0, 20).map((kw) => (
              <li key={kw}>{kw}</li>
            ))}
          </ul>
          {coverage.missing.length > 20 && (
            <p className="keyword-coverage-more">+{coverage.missing.length - 20} more</p>
          )}
        </div>
      )}
    </section>
  );
}
