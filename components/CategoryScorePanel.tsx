"use client";

import type { CategoryScores } from "@/types";

interface CategoryScorePanelProps {
  before: CategoryScores;
  after: CategoryScores;
}

interface CategoryRow {
  key: keyof CategoryScores;
  label: string;
  hint: string;
}

const CATEGORIES: CategoryRow[] = [
  { key: "content", label: "Content", hint: "Tone, metrics, word choice" },
  { key: "tailoring", label: "Tailoring", hint: "Job description alignment" },
  { key: "repetition", label: "Repetition", hint: "Varied action verbs" },
  { key: "measurable", label: "Quantifying impact", hint: "Bullets with numbers" },
  { key: "sections", label: "Sections", hint: "Structure and contact info" },
  { key: "atsEssentials", label: "ATS essentials", hint: "Parse quality and skills" },
];

function scoreClass(value: number | null): string {
  if (value === null) return "cat-unknown";
  if (value >= 85) return "cat-excellent";
  if (value >= 70) return "cat-good";
  if (value >= 55) return "cat-fair";
  return "cat-poor";
}

function formatScore(value: number | null): string {
  return value === null ? "—" : `${value}%`;
}

function ScoreBar({ value }: { value: number | null }) {
  if (value === null) {
    return (
      <div
        className="cat-bar cat-bar-unknown"
        title="Add a job description to unlock this score"
        role="progressbar"
        aria-valuenow={0}
        aria-valuemin={0}
        aria-valuemax={100}
      />
    );
  }
  return (
    <div className="cat-bar-track" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
      <div
        className={`cat-bar-fill ${scoreClass(value)}`}
        style={{ width: `${Math.min(100, value)}%` }}
      />
    </div>
  );
}

export default function CategoryScorePanel({ before, after }: CategoryScorePanelProps) {
  return (
    <div className="category-scores">
      <div className="category-scores-header">
        <h2>Category scores</h2>
        <span className="category-scores-sub">Before and after by area</span>
      </div>

      <div className="category-grid">
        {CATEGORIES.map(({ key, label, hint }) => {
          const beforeVal = before[key];
          const afterVal = after[key];
          const improved =
            beforeVal !== null &&
            afterVal !== null &&
            typeof beforeVal === "number" &&
            typeof afterVal === "number" &&
            afterVal > beforeVal;

          return (
            <div key={key} className="category-card">
              <div className="category-card-top">
                <div>
                  <span className="category-label">{label}</span>
                  <span className="category-hint">{hint}</span>
                </div>
                <div className="category-values">
                  <span className="cat-before">{formatScore(beforeVal)}</span>
                  <span className="cat-arrow" aria-hidden>→</span>
                  <span className={`cat-after ${scoreClass(afterVal)}`}>
                    {formatScore(afterVal)}
                  </span>
                  {improved && <span className="cat-up" aria-label="Improved">▲</span>}
                </div>
              </div>
              <ScoreBar value={afterVal} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
