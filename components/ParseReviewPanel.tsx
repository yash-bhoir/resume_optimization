"use client";

import { useState } from "react";
import { parseTextToDocument } from "@/lib/resume-schema";
import { LIMITS } from "@/lib/constants";

interface ParseReviewPanelProps {
  text: string;
  onChange: (text: string, restructured: boolean) => void;
}

export default function ParseReviewPanel({ text, onChange }: ParseReviewPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const [draft, setDraft] = useState(text);

  const handleApply = () => {
    const trimmed = draft.trim();
    if (trimmed.length < LIMITS.RESUME_MIN_CHARS) return;
    onChange(trimmed, true);
    setExpanded(false);
  };

  return (
    <section className="parse-review-panel" aria-labelledby="parse-review-heading">
      <div className="parse-review-header">
        <h3 id="parse-review-heading">Review extracted text</h3>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => {
            setDraft(text);
            setExpanded((v) => !v);
          }}
        >
          {expanded ? "Hide editor" : "Edit before optimizing"}
        </button>
      </div>
      <p className="parse-review-hint">
        {text.length.toLocaleString()} characters extracted. Fix any missing jobs or garbled text
        before tailoring to the job.
      </p>

      {expanded && (
        <div className="parse-review-editor">
          <textarea
            className="parse-review-textarea"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={14}
            aria-label="Edit parsed resume text"
          />
          <div className="parse-review-actions">
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={handleApply}
              disabled={draft.trim().length < LIMITS.RESUME_MIN_CHARS}
            >
              Apply changes
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => {
                setDraft(text);
                setExpanded(false);
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

export function reparseTextToDocument(text: string) {
  return parseTextToDocument(text, false);
}
