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

  return (
    <div className="score-dashboard">
      <div className="score-row">
        <div className="score-card">
          <span className="score-label">Keyword Match</span>
          <div className="score-values">
            <span className="score-before">{matchScoreBefore}%</span>
            <span className="score-arrow">→</span>
            <span className="score-after">{matchScoreAfter}%</span>
          </div>
          {keywordGain !== 0 && (
            <span className={`score-gain ${keywordGain < 0 ? "score-loss" : ""}`}>
              {keywordGain > 0 ? "+" : ""}
              {keywordGain}% keywords
            </span>
          )}
        </div>

        <div className="score-card highlight">
          <span className="score-label">ATS Score (estimated)</span>
          <div className="score-values">
            <span className="score-before">{atsScoreBefore}%</span>
            <span className="score-arrow">→</span>
            <span className="score-after">{atsScoreAfter}%</span>
          </div>
          {atsGain !== 0 && (
            <span className={`score-gain ${atsGain < 0 ? "score-loss" : ""}`}>
              {atsGain > 0 ? "+" : ""}
              {atsGain}% ATS compatibility
            </span>
          )}
        </div>

        <div className="score-card">
          <span className="score-label">Optimization</span>
          <div className="score-values">
            <span className={`score-after large ${(optimizationGain || atsGain) < 0 ? "negative" : ""}`}>
              {(optimizationGain || atsGain) > 0 ? "+" : ""}
              {optimizationGain || atsGain}%
            </span>
          </div>
          {optimizationPercent > 0 && (
            <span className="score-gain">{optimizationPercent}% improvement</span>
          )}
        </div>

        <div className="score-card neutral">
          <span className="score-label">Pages</span>
          <div className="score-values">
            <span className="score-after large">{pageCount}</span>
          </div>
          <span className="score-gain">2 pages OK</span>
        </div>
      </div>

      {atsBreakdownAfter && (
        <details className="ats-breakdown">
          <summary>ATS breakdown (after optimization)</summary>
          <ul>
            <li>JD keywords: {atsBreakdownAfter.keywordScore}%</li>
            <li>Required skills: {atsBreakdownAfter.skillsScore}%</li>
            <li>Measurable bullets: {atsBreakdownAfter.measurableScore ?? "—"}%</li>
            <li>Word choice / content: {atsBreakdownAfter.contentScore ?? "—"}%</li>
            <li>Structure: {atsBreakdownAfter.structureScore}%</li>
            <li>Parse quality: {atsBreakdownAfter.parseScore}%</li>
          </ul>
        </details>
      )}
    </div>
  );
}
