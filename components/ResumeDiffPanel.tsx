"use client";

import { useMemo, useRef } from "react";
import { latexToHtml } from "@/lib/latex-to-html";
import { buildHighlightedComparison } from "@/lib/resume-diff";
import { isLatexSource } from "@/lib/resume-text";

interface ResumeDiffPanelProps {
  originalText: string;
  optimizedLatex: string;
  showDiff: boolean;
  leftTitle?: string;
  rightTitle?: string;
  leftSubtitle?: string;
  rightSubtitle?: string;
}

function escapeAndPreserveLines(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br/>");
}

function renderOriginalHtml(originalText: string): string {
  if (isLatexSource(originalText)) {
    try {
      return latexToHtml(originalText);
    } catch {
      return `<div class="compare-diff-document">${escapeAndPreserveLines(originalText)}</div>`;
    }
  }
  const lines = originalText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  if (lines.length === 0) return "";
  return `<div class="compare-diff-document">${lines
    .map((line) => `<div class="diff-line">${escapeAndPreserveLines(line)}</div>`)
    .join("")}</div>`;
}

function renderOptimizedHtml(optimizedLatex: string): string {
  try {
    return latexToHtml(optimizedLatex);
  } catch {
    return `<div class="compare-diff-document">${escapeAndPreserveLines(optimizedLatex)}</div>`;
  }
}

export default function ResumeDiffPanel({
  originalText,
  optimizedLatex,
  showDiff,
  leftTitle = "Before optimization",
  rightTitle = "After optimization",
  leftSubtitle,
  rightSubtitle,
}: ResumeDiffPanelProps) {
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);

  const { beforeHtml, afterHtml } = useMemo(() => {
    if (!showDiff) {
      return {
        beforeHtml: renderOriginalHtml(originalText),
        afterHtml: renderOptimizedHtml(optimizedLatex),
      };
    }
    return buildHighlightedComparison(originalText, optimizedLatex);
  }, [originalText, optimizedLatex, showDiff]);

  const syncScroll = (source: "left" | "right") => {
    const left = leftRef.current;
    const right = rightRef.current;
    if (!left || !right) return;
    if (source === "left") right.scrollTop = left.scrollTop;
    else left.scrollTop = right.scrollTop;
  };

  return (
    <div className="comparison-grid compare-mode compare-highlight">
      <div className="compare-panel">
        <div className="panel-header">
          {leftTitle}
          {leftSubtitle ? <span className="panel-header-sub">{leftSubtitle}</span> : null}
        </div>
        <div className="panel-body compare-body" ref={leftRef} onScroll={() => syncScroll("left")}>
          <div
            className={`resume-page compare-resume ${showDiff ? "diff-formatted" : ""}`}
            dangerouslySetInnerHTML={{ __html: beforeHtml }}
          />
        </div>
      </div>
      <div className="compare-panel">
        <div className="panel-header">
          {rightTitle}
          {rightSubtitle ? <span className="panel-header-sub">{rightSubtitle}</span> : null}
        </div>
        <div className="panel-body compare-body" ref={rightRef} onScroll={() => syncScroll("right")}>
          <div
            className={`resume-page compare-resume ${showDiff ? "diff-formatted" : ""}`}
            dangerouslySetInnerHTML={{ __html: afterHtml }}
          />
        </div>
      </div>
    </div>
  );
}
