"use client";

interface JobDescriptionInputProps {
  value: string;
  onChange: (value: string) => void;
}

export default function JobDescriptionInput({
  value,
  onChange,
}: JobDescriptionInputProps) {
  const charCount = value.trim().length;
  const isReady = charCount >= 20;
  const showReminder = charCount > 0 && charCount < 20;

  return (
    <div className={`panel ${!isReady ? "panel-jd-pending" : "panel-jd-ready"}`}>
      <div className="panel-header-row">
        <div>
          <h2 className="panel-title">Job description</h2>
          <p className="panel-desc">Paste the full posting for best results</p>
        </div>
        <span className="panel-icon" aria-hidden>💼</span>
      </div>

      {!isReady && (
        <div className="jd-reminder" role="status">
          <strong>Paste the full job description</strong>
          <span>
            Tailoring unlocks +10–15 score points. Without a JD, keyword match stays at ??%
            (like Enhancv).
          </span>
        </div>
      )}

      <textarea
        className="jd-input"
        placeholder="Paste the complete job description — include requirements, skills, responsibilities, and qualifications for accurate keyword matching…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Job description"
      />
      <p className={`jd-char-count ${isReady ? "ready" : ""}`}>
        {isReady
          ? `${charCount.toLocaleString()} characters — tailoring & keyword match enabled`
          : showReminder
            ? `${charCount} / 20 min — add more for tailoring score`
            : `${charCount} / 20 min characters`}
      </p>
    </div>
  );
}
