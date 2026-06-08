"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { latexToHtml } from "@/lib/latex-to-html";
import { rebuildLatexFromEditableDom } from "@/lib/latex-sync";
import { measureDomPageFit, LETTER_PAGE_HEIGHT } from "@/lib/page-fit";

interface OptimizedResumePanelProps {
  latexSource: string;
  editMode: boolean;
  onEditModeChange: (enabled: boolean) => void;
  onLatexChange: (latex: string) => void;
  onPageFitChange: (fit: number, pageCount?: number) => void;
  jobDescription: string;
  onReoptimize: () => void;
}

async function downloadBlob(url: string, body: object, filename: string) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Download failed");
  }
  const blob = await res.blob();
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

export default function OptimizedResumePanel({
  latexSource,
  editMode,
  onEditModeChange,
  onLatexChange,
  onPageFitChange,
  onReoptimize,
}: OptimizedResumePanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [renderError, setRenderError] = useState(false);
  const [html, setHtml] = useState("");
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    try {
      setHtml(latexToHtml(latexSource));
      setRenderError(false);
    } catch {
      setRenderError(true);
    }
  }, [latexSource]);

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.querySelectorAll("[data-field]").forEach((el) => {
      (el as HTMLElement).contentEditable = editMode ? "true" : "false";
    });
  }, [editMode, html]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (containerRef.current) {
        const fit = measureDomPageFit(containerRef.current);
        onPageFitChange(fit.pageFit, fit.pageCount);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [html, latexSource, onPageFitChange]);

  const syncEdits = useCallback(() => {
    if (!containerRef.current || !editMode) return;
    const updated = rebuildLatexFromEditableDom(containerRef.current, latexSource);
    onLatexChange(updated);
  }, [editMode, latexSource, onLatexChange]);

  const handleDownload = async (type: "pdf" | "docx" | "tex" | "txt") => {
    setDownloading(type);
    try {
      if (type === "pdf") {
        await downloadBlob("/api/export/pdf", { latexSource }, "optimized-resume.pdf");
      } else if (type === "docx") {
        await downloadBlob("/api/export/docx", { latexSource }, "optimized-resume.docx");
      } else {
        await downloadBlob(
          "/api/export/tex",
          { latexSource, format: type },
          `optimized-resume.${type}`
        );
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Download failed");
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="compare-panel">
      <div className="optimized-toolbar">
        <div className="toolbar-section">
          <button
            className={`btn btn-secondary btn-sm ${editMode ? "active" : ""}`}
            onClick={() => onEditModeChange(!editMode)}
          >
            {editMode ? "✓ Editing" : "Edit"}
          </button>
          <button className="btn btn-secondary btn-sm" onClick={onReoptimize}>
            New JD
          </button>
        </div>
        <span className="toolbar-divider" aria-hidden />
        <div className="toolbar-section">
          <button
            className="btn btn-primary btn-sm"
            disabled={!!downloading}
            onClick={() => handleDownload("pdf")}
          >
            {downloading === "pdf" ? "…" : "PDF"}
          </button>
          <button
            className="btn btn-secondary btn-sm"
            disabled={!!downloading}
            onClick={() => handleDownload("docx")}
          >
            {downloading === "docx" ? "…" : "DOCX"}
          </button>
          <button
            className="btn btn-secondary btn-sm"
            disabled={!!downloading}
            onClick={() => handleDownload("tex")}
          >
            .tex
          </button>
          <button
            className="btn btn-secondary btn-sm"
            disabled={!!downloading}
            onClick={() => handleDownload("txt")}
          >
            TXT
          </button>
        </div>
      </div>
      <div className="panel-header">Optimized resume</div>
      <div className="panel-body">
        {renderError ? (
          <div className="document-view resume-fallback">{latexSource}</div>
        ) : (
          <div
            ref={containerRef}
            className={`resume-page ${editMode ? "edit-mode" : ""}`}
            style={{ minHeight: LETTER_PAGE_HEIGHT * 0.75 }}
            dangerouslySetInnerHTML={{ __html: html }}
            onBlur={syncEdits}
            onInput={syncEdits}
            suppressContentEditableWarning
          />
        )}
      </div>
    </div>
  );
}
