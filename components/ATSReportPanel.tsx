"use client";

import type { ResumeAnalysis } from "@/types";

interface ATSReportPanelProps {
  before: ResumeAnalysis;
  after: ResumeAnalysis;
}

function gradeClass(grade: ResumeAnalysis["grade"]): string {
  switch (grade) {
    case "EXCELLENT":
      return "grade-excellent";
    case "GOOD":
      return "grade-good";
    case "FAIR":
      return "grade-fair";
    default:
      return "grade-poor";
  }
}

function ScoreRing({ score, label, variant }: { score: number; label: string; variant?: "after" }) {
  return (
    <div className={`score-ring ${variant || ""}`}>
      <span className="score-ring-label">{label}</span>
      <div className="score-ring-value">{score}</div>
      <span className="score-ring-sub">out of 100</span>
    </div>
  );
}

export default function ATSReportPanel({ before, after }: ATSReportPanelProps) {
  const sections = ["Contact", "Summary", "Experience", "Skills", "Education", "Content"];
  const issuesFixed = Math.max(0, before.issueCount - after.issueCount);
  const openIssues = after.issues.filter((i) => i.severity !== "good");

  return (
    <div className="ats-report">
      <div className="ats-report-header">
        <h2>Resume check report</h2>
        <span className={`ats-grade ${gradeClass(after.grade)}`}>{after.grade}</span>
      </div>

      <div className="ats-score-compare">
        <ScoreRing score={before.score} label="Before" />
        <span className="ats-compare-arrow" aria-hidden>→</span>
        <ScoreRing score={after.score} label="After" variant="after" />
      </div>

      <div className="ats-stats-row">
        <div className="ats-stat">
          <span className="ats-stat-value">{after.issueCount}</span>
          <span className="ats-stat-label">Issues left</span>
        </div>
        <div className="ats-stat">
          <span className="ats-stat-value">{after.measurablePercent}%</span>
          <span className="ats-stat-label">Bullets with metrics</span>
        </div>
        <div className="ats-stat">
          <span className="ats-stat-value">{issuesFixed > 0 ? `-${issuesFixed}` : "0"}</span>
          <span className="ats-stat-label">Issues fixed</span>
        </div>
      </div>

      <div className="ats-section-issues">
        <h3>By section</h3>
        <div className="section-issue-grid">
          {sections.map((section) => {
            const beforeCount = before.sectionIssues[section] || 0;
            const afterCount = after.sectionIssues[section] || 0;
            return (
              <div
                key={section}
                className={`section-issue-chip ${afterCount === 0 ? "ok" : ""}`}
              >
                <span className="section-name">{section}</span>
                <span className="section-count">{afterCount === 0 ? "✓" : afterCount}</span>
                {beforeCount > afterCount && (
                  <span className="section-fixed">was {beforeCount}</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {openIssues.length > 0 && (
        <div className="ats-suggestions">
          <h3>Suggestions</h3>
          <ul className="ats-issue-list">
            {openIssues.slice(0, 6).map((issue, idx) => (
              <li
                key={idx}
                className={`ats-issue ats-issue-${issue.severity}`}
              >
                <span className="ats-issue-section">{issue.section}</span>
                <span className="ats-issue-msg">{issue.message}</span>
                {issue.suggestion && (
                  <span className="ats-issue-tip">{issue.suggestion}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {after.issues.filter((i) => i.severity === "good").length > 0 && (
        <p className="ats-issue ats-issue-good" style={{ marginTop: "0.75rem", border: "none" }}>
          ✓ {after.issues.filter((i) => i.severity === "good").length} areas passed ATS checks
        </p>
      )}
    </div>
  );
}
