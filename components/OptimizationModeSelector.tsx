"use client";

import type { DetectedFormat, OptimizationMode } from "@/types";
import { canPreserveLayout } from "@/lib/preserve-layout-utils";
import Link from "next/link";

interface OptimizationModeSelectorProps {
  mode: OptimizationMode;
  format: DetectedFormat | null;
  preserveNote?: string;
  isPro?: boolean;
  isSignedIn?: boolean;
  onChange: (mode: OptimizationMode) => void;
}

export default function OptimizationModeSelector({
  mode,
  format,
  preserveNote,
  isPro = false,
  isSignedIn = false,
  onChange,
}: OptimizationModeSelectorProps) {
  const canPreserve = format ? canPreserveLayout(format) : false;
  const preserveLocked = !isPro;

  return (
    <div className="optimization-mode-panel" role="group" aria-label="Optimization mode">
      <h3 className="mode-panel-title">How should we format the output?</h3>
      <p className="mode-panel-desc">
        Keep your existing design, or switch to our ATS-friendly template.
      </p>

      <div className="mode-options">
        <button
          type="button"
          className={`mode-option ${mode === "preserve" ? "active" : ""} ${preserveLocked ? "locked" : ""}`}
          onClick={() => {
            if (preserveLocked) return;
            onChange("preserve");
          }}
          aria-pressed={mode === "preserve"}
          disabled={preserveLocked}
        >
          <span className="mode-option-title">
            Keep my layout
            {preserveLocked && <span className="pro-badge">Pro</span>}
          </span>
          <span className="mode-option-desc">
            {preserveLocked
              ? "Pro feature — preserves your original DOCX design"
              : canPreserve
                ? "Rewrite content only — fonts, colors, and structure stay the same"
                : "Works best with DOCX uploads"}
          </span>
          {preserveLocked && (
            <span className="mode-option-warn">
              {isSignedIn ? (
                <Link href="/pricing">Upgrade to Pro</Link>
              ) : (
                "Sign in and upgrade to Pro to unlock"
              )}
            </span>
          )}
        </button>

        <button
          type="button"
          className={`mode-option ${mode === "template" ? "active" : ""}`}
          onClick={() => onChange("template")}
          aria-pressed={mode === "template"}
        >
          <span className="mode-option-title">ATS template</span>
          <span className="mode-option-desc">
            Clean, recruiter-tested layout optimized for parsing systems
          </span>
        </button>
      </div>

      {preserveNote && mode === "preserve" && !preserveLocked && (
        <p className="mode-note" role="status">{preserveNote}</p>
      )}
    </div>
  );
}
