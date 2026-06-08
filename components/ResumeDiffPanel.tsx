"use client";

import { useMemo, useRef } from "react";
import { diffWords, diffToHtml } from "@/lib/resume-diff";
import { resumeToPlainText } from "@/lib/resume-text";

interface ResumeDiffPanelProps {
  originalText: string;
  optimizedLatex: string;
  showDiff: boolean;
}

export default function ResumeDiffPanel({
  originalText,
  optimizedLatex,
  showDiff,
}: ResumeDiffPanelProps) {
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);

  const { beforeHtml, afterHtml } = useMemo(() => {
    const before = resumeToPlainText(originalText, false);
    const after = resumeToPlainText(optimizedLatex, true);

    if (!showDiff) {
      return {
        beforeHtml: escapeAndPreserveLines(before),
        afterHtml: escapeAndPreserveLines(after),
      };
    }

    const segments = diffWords(before, after);
    return {
      beforeHtml: diffToHtml(segments, "before"),
      afterHtml: diffToHtml(segments, "after"),
    };
  }, [originalText, optimizedLatex, showDiff]);

  const syncScroll = (source: "left" | "right") => {
    const left = leftRef.current;
    const right = rightRef.current;
    if (!left || !right) return;
    if (source === "left") right.scrollTop = left.scrollTop;
    else left.scrollTop = right.scrollTop;
  };

  return (
    <div className="diff-grid">
      <div className="compare-panel">
        <div className="panel-header">Original</div>
        <div className="panel-body">
          <div
            ref={leftRef}
            className="document-view diff-view"
            onScroll={() => syncScroll("left")}
            dangerouslySetInnerHTML={{ __html: beforeHtml }}
          />
        </div>
      </div>
      <div className="compare-panel">
        <div className="panel-header">Optimized</div>
        <div className="panel-body">
          <div
            ref={rightRef}
            className="document-view diff-view"
            onScroll={() => syncScroll("right")}
            dangerouslySetInnerHTML={{ __html: afterHtml }}
          />
        </div>
      </div>
    </div>
  );
}

function escapeAndPreserveLines(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br/>");
}
