"use client";

import type { AtsBreakdown } from "@/types";

interface ScoreDashboardProps {
  matchScoreBefore: number;
  matchScoreAfter: number;
  atsScoreBefore: number;
  atsScoreAfter: number;
  optimizationGain: number;
  optimizationPercent: number;
  atsBreakdownBefore?: AtsBreakdown;
  atsBreakdownAfter?: AtsBreakdown;
  pageCount?: number;
}

export default function ScoreDashboard({
  matchScoreBefore,
  matchScoreAfter,
  atsScoreBefore,
  atsScoreAfter,
  optimizationGain,
  optimizationPercent,
  atsBreakdownAfter,
  pageCount = 1,
}: ScoreDashboardProps) {
  const keywordGain = matchScoreAfter - matchScoreBefore;
  const atsGain = atsScoreAfter - atsScoreBefore;
  const netGain = optimizationGain || atsGain;

  return (
    <div className="score-dashboard">
      <div className="score-row">
        <div className="score-card">
          <span className="score-label">Keyword match</span>
          <div className="score-values">
            <span className="score-before">{matchScoreBefore}%</span>
            <span className="score-arrow" aria-hidden>→</span>
            <span className="score-after">{matchScoreAfter}%</span>
          </div>
          {keywordGain !== 0 && (
            <span className={`score-gain ${keywordGain < 0 ? "score-loss" : ""}`}>
              {keywordGain > 0 ? "+" : ""}
              {keywordGain}% job keyword alignment
            </span>
          )}
          <span className="score-hint">Based on skills &amp; requirements from the job description</span>
          <p className="score-disclaimer">
            Estimated scores — not from a real employer ATS. Use keyword coverage below to verify
            tailoring.
          </p>
        </div>

        <div className="score-card highlight">
          <span className="score-label">ATS score (estimate)</span>
          <div className="score-values">
            <span className="score-before">{atsScoreBefore}%</span>
            <span className="score-arrow" aria-hidden>→</span>
            <span className="score-after">{atsScoreAfter}%</span>
          </div>
          {atsGain !== 0 && (
            <span className={`score-gain ${atsGain < 0 ? "score-loss" : ""}`}>
              {atsGain > 0 ? "+" : ""}
              {atsGain}% parsing compatibility
            </span>
          )}
        </div>

        <div className="score-card">
          <span className="score-label">Net improvement</span>
          <div className="score-values">
            <span className={`score-after large ${netGain < 0 ? "negative" : ""}`}>
              {netGain > 0 ? "+" : ""}
              {netGain}%
            </span>
          </div>
          {optimizationPercent > 0 && (
            <span className="score-gain">{optimizationPercent}% relative gain</span>
          )}
        </div>

        <div className="score-card neutral">
          <span className="score-label">Page count</span>
          <div className="score-values">
            <span className="score-after large">{pageCount}</span>
          </div>
          <span className="score-gain">
            {pageCount <= 2 ? "Within typical length" : "Consider trimming"}
          </span>
        </div>
      </div>

      {atsBreakdownAfter && (
        <details className="ats-breakdown">
          <summary>Score breakdown after optimization</summary>
          <ul>
            <li>JD keywords: {atsBreakdownAfter.keywordScore}%</li>
            <li>Required skills: {atsBreakdownAfter.skillsScore}%</li>
            <li>Measurable bullets: {atsBreakdownAfter.measurableScore ?? "—"}%</li>
            <li>Word choice: {atsBreakdownAfter.contentScore ?? "—"}%</li>
            <li>Structure: {atsBreakdownAfter.structureScore}%</li>
            <li>Parse quality: {atsBreakdownAfter.parseScore}%</li>
          </ul>
        </details>
      )}
    </div>
  );
}
