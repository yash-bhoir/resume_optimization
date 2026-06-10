"use client";

import { LIMITS } from "@/lib/constants";
import { validateJobDescriptionClient, wordCount } from "@/lib/client-validation";

interface JobDescriptionInputProps {
  value: string;
  onChange: (value: string) => void;
}

function BriefcaseIcon() {
  return (
    <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <rect x="2" y="6" width="14" height="9" rx="1.5" />
      <path d="M6 6V4.5A1.5 1.5 0 0 1 7.5 3h3A1.5 1.5 0 0 1 12 4.5V6" />
      <path d="M2 9.5h14" />
    </svg>
  );
}

export default function JobDescriptionInput({
  value,
  onChange,
}: JobDescriptionInputProps) {
  const trimmed = value.trim();
  const charCount = trimmed.length;
  const words = wordCount(trimmed);
  const validation = trimmed.length > 0 ? validateJobDescriptionClient(value) : null;
  const isReady = validation?.valid === true;
  const showReminder = trimmed.length > 0 && !isReady;

  return (
    <div className={`panel ${!isReady ? "panel-jd-pending" : "panel-jd-ready"}`}>
      <div className="panel-header-row">
        <div>
          <h2 className="panel-title">Job description</h2>
          <p className="panel-desc">Paste the full posting — requirements, skills, and responsibilities</p>
        </div>
        <span className="panel-icon" aria-hidden>
          <BriefcaseIcon />
        </span>
      </div>

      {!isReady && trimmed.length === 0 && (
        <div className="jd-reminder" role="status">
          <strong>Add the complete job posting</strong>
          <span>
            Keyword matching needs at least {LIMITS.JD_MIN_CHARS} characters and {LIMITS.JD_MIN_WORDS}{" "}
            words for accurate tailoring.
          </span>
        </div>
      )}

      <textarea
        className="jd-input"
        placeholder="Paste the job description here — include required skills, responsibilities, and qualifications…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Job description"
        aria-describedby="jd-char-count"
        maxLength={LIMITS.JD_MAX_CHARS}
      />

      {showReminder && validation?.error && (
        <p className="field-error" role="alert">
          {validation.error}
        </p>
      )}

      <p id="jd-char-count" className={`jd-char-count ${isReady ? "ready" : ""}`}>
        {isReady
          ? `${charCount.toLocaleString()} characters · ${words} words — ready to optimize`
          : trimmed.length > 0
            ? `${charCount} of ${LIMITS.JD_MIN_CHARS} min characters · ${words} of ${LIMITS.JD_MIN_WORDS} min words`
            : `${charCount} characters`}
      </p>
    </div>
  );
}

export function isJobDescriptionReady(value: string): boolean {
  return validateJobDescriptionClient(value).valid;
}
