"use client";

import { useRef, useState } from "react";
import OriginalResumePreview from "@/components/OriginalResumePreview";
import OptimizedResumePreview from "@/components/OptimizedResumePreview";
import ResumeDiffPanel from "@/components/ResumeDiffPanel";
import { getOptimizedFileName } from "@/lib/export-filename";
import type { DetectedFormat } from "@/types";

export interface ResumeCompareData {
  rawText: string;
  latexSource: string;
  detectedFormat?: DetectedFormat | string;
  originalFileName?: string;
  originalFileBase64?: string;
  originalTexSource?: string;
  effectiveMode?: "template" | "preserve";
  preservedDocxBase64?: string;
}

interface ResumeCompareViewProps {
  data: ResumeCompareData;
  fullPage?: boolean;
}

type CompareViewMode = "preview" | "highlight";

export default function ResumeCompareView({ data, fullPage = false }: ResumeCompareViewProps) {
  const [viewMode, setViewMode] = useState<CompareViewMode>("preview");
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);

  const syncScroll = (source: "left" | "right") => {
    const left = leftRef.current;
    const right = rightRef.current;
    if (!left || !right) return;
    if (source === "left") right.scrollTop = left.scrollTop;
    else left.scrollTop = right.scrollTop;
  };

  const optimizedSub =
    data.effectiveMode === "preserve"
      ? "Your layout preserved — PDF preview"
      : "ATS template — PDF preview";

  return (
    <div className={`resume-compare-view ${fullPage ? "full-page" : ""}`}>
      <div className="compare-view-toolbar" role="toolbar" aria-label="Comparison view options">
        <div className="compare-view-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={viewMode === "preview"}
            className={`compare-view-tab ${viewMode === "preview" ? "active" : ""}`}
            onClick={() => setViewMode("preview")}
          >
            PDF preview
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={viewMode === "highlight"}
            className={`compare-view-tab ${viewMode === "highlight" ? "active" : ""}`}
            onClick={() => setViewMode("highlight")}
          >
            Highlight changes
          </button>
        </div>
        {viewMode === "highlight" && (
          <div className="diff-legend compare-view-legend" aria-label="Change legend">
            <span className="diff-legend-item removed">Removed</span>
            <span className="diff-legend-item added">Added</span>
          </div>
        )}
      </div>

      {viewMode === "highlight" ? (
        <ResumeDiffPanel
          originalText={data.rawText}
          optimizedLatex={data.latexSource}
          showDiff
          leftTitle="Your upload"
          rightTitle="Optimized version"
          leftSubtitle="Strikethrough = removed text"
          rightSubtitle="Green highlight = new or changed text"
        />
      ) : (
        <div className="comparison-grid compare-mode compare-real">
          <div className="compare-panel">
            <div className="panel-header">
              Your upload
              {data.originalFileName ? (
                <span className="panel-header-sub">
                  {data.originalFileName}
                  {data.detectedFormat === "docx" ? " · PDF preview" : ""}
                </span>
              ) : null}
            </div>
            <div
              className="panel-body compare-body"
              ref={leftRef}
              onScroll={() => syncScroll("left")}
            >
              <OriginalResumePreview
                format={data.detectedFormat}
                fileName={data.originalFileName}
                originalFileBase64={data.originalFileBase64}
                originalTexSource={data.originalTexSource}
                rawText={data.rawText}
              />
            </div>
          </div>
          <div className="compare-panel">
            <div className="panel-header">
              Optimized version
              <span className="panel-header-sub">{optimizedSub}</span>
            </div>
            <div
              className="panel-body compare-body"
              ref={rightRef}
              onScroll={() => syncScroll("right")}
            >
              <OptimizedResumePreview
                latexSource={data.latexSource}
                effectiveMode={data.effectiveMode}
                preservedDocxBase64={data.preservedDocxBase64}
                fileName={getOptimizedFileName(data.originalFileName, "docx")}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
