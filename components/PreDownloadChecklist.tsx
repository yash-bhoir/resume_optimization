"use client";

import { useMemo, useState } from "react";
import type { ResumeAnalysis } from "@/types";
import {
  buildPreDownloadChecklist,
  checklistPassCount,
} from "@/lib/pre-download-checklist";

interface PreDownloadChecklistProps {
  analysisBefore: ResumeAnalysis;
  analysisAfter: ResumeAnalysis;
  keywordMatch: number;
  hasJobDescription: boolean;
}

export default function PreDownloadChecklist({
  analysisBefore,
  analysisAfter,
  keywordMatch,
  hasJobDescription,
}: PreDownloadChecklistProps) {
  const [expanded, setExpanded] = useState(true);

  const items = useMemo(
    () => buildPreDownloadChecklist(analysisAfter, keywordMatch, hasJobDescription),
    [analysisAfter, keywordMatch, hasJobDescription]
  );

  const passed = checklistPassCount(items);
  const total = items.length;
  const allPass = passed === total;
  const criticalFails = items.filter((i) => !i.pass && i.critical);

  const beforeFirstPerson = analysisBefore.issues.some(
    (i) => i.section === "Summary" && i.message.includes("first person")
  );
  const afterFirstPerson = analysisAfter.issues.some(
    (i) => i.section === "Summary" && i.message.includes("first person")
  );

  return (
    <div className={`pre-download-checklist ${allPass ? "all-pass" : ""}`}>
      <button
        type="button"
        className="checklist-header"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
      >
        <div>
          <strong>Pre-download checklist</strong>
          <span className="checklist-sub">
            {passed}/{total} checks passed
            {!allPass && criticalFails.length > 0
              ? ` · ${criticalFails.length} critical`
              : ""}
          </span>
        </div>
        <span className="checklist-chevron">{expanded ? "▾" : "▸"}</span>
      </button>

      {expanded && (
        <div className="checklist-body">
          <ul className="checklist-items">
            {items.map((item) => (
              <li key={item.id} className={`checklist-item ${item.pass ? "pass" : "fail"}`}>
                <span className="checklist-icon" aria-hidden>
                  {item.pass ? "✓" : "!"}
                </span>
                <div className="checklist-text">
                  <span className="checklist-label">{item.label}</span>
                  {!item.pass && item.tip && (
                    <span className="checklist-tip">{item.tip}</span>
                  )}
                </div>
              </li>
            ))}
          </ul>

          {(beforeFirstPerson && !afterFirstPerson) ||
          analysisBefore.repetitionWarnings.length > analysisAfter.repetitionWarnings.length ? (
            <div className="checklist-fixed">
              <span className="checklist-fixed-title">Fixed by optimization</span>
              <ul>
                {beforeFirstPerson && !afterFirstPerson && (
                  <li>Removed first-person summary</li>
                )}
                {analysisBefore.repetitionWarnings.map((w) => {
                  const afterW = analysisAfter.repetitionWarnings.find(
                    (a) => a.word === w.word
                  );
                  if (!afterW || afterW.count < w.count) {
                    return (
                      <li key={w.word}>
                        Reduced &quot;{w.word}&quot; ({w.count}→{afterW?.count ?? 0})
                      </li>
                    );
                  }
                  return null;
                })}
              </ul>
            </div>
          ) : null}

          {!allPass && (
            <p className="checklist-note">
              Fix flagged items or use Edit mode before downloading and applying.
            </p>
          )}
          {allPass && (
            <p className="checklist-note pass-note">
              All checks passed — ready to download and apply.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
