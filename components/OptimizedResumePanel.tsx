"use client";



import { useCallback, useEffect, useRef, useState } from "react";

import { useAuth, useClerk } from "@clerk/nextjs";

import { rebuildLatexFromEditableDom } from "@/lib/latex-sync";

import { measureDomPageFit, LETTER_PAGE_HEIGHT } from "@/lib/page-fit";

import UpgradeModal from "@/components/UpgradeModal";
import DocxPdfPreview from "@/components/DocxPdfPreview";
import { trackEvent } from "@/lib/analytics";
import { getOptimizedFileName } from "@/lib/export-filename";
import type { OptimizationMode } from "@/types";



interface OptimizedResumePanelProps {

  latexSource: string;

  editMode: boolean;

  onEditModeChange: (enabled: boolean) => void;

  onLatexChange: (latex: string) => void;

  onPageFitChange: (fit: number, pageCount?: number) => void;

  jobDescription: string;

  onReoptimize: () => void;

  effectiveMode?: OptimizationMode;

  preservedDocxBase64?: string;

  preservedTexSource?: string;

  layoutNote?: string;

  originalFileName?: string;

}



async function downloadBlob(url: string, body: object, filename: string) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    if (res.status === 403 && err.code === "QUOTA_EXCEEDED") {
      const quotaErr = new Error("quota_exceeded") as Error & {
        quota?: { used: number; limit: number; resetDate?: string };
      };
      quotaErr.quota = { used: err.used, limit: err.limit, resetDate: err.resetDate };
      throw quotaErr;
    }
    throw new Error(err.error || "Download failed — try again or pick a different format");
  }

  const blob = await res.blob();
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}



function downloadText(content: string, filename: string, mime = "text/plain") {

  const blob = new Blob([content], { type: mime });

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

  effectiveMode = "template",

  preservedDocxBase64,

  preservedTexSource,

  layoutNote,

  originalFileName,

}: OptimizedResumePanelProps) {

  const { isSignedIn, isLoaded } = useAuth();
  const { openSignIn } = useClerk();
  const containerRef = useRef<HTMLDivElement>(null);

  const skipHtmlSyncRef = useRef(false);

  const latexRef = useRef(latexSource);

  const [renderError, setRenderError] = useState(false);

  const [html, setHtml] = useState("");

  const [downloading, setDownloading] = useState<string | null>(null);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [upgradeMeta, setUpgradeMeta] = useState({
    used: 1,
    limit: 1,
    resetDate: "",
  });



  const isPreserve = effectiveMode === "preserve";



  useEffect(() => {
    latexRef.current = latexSource;

    if (skipHtmlSyncRef.current) {
      skipHtmlSyncRef.current = false;
      return;
    }

    let cancelled = false;
    void import("@/lib/latex-to-html").then(({ latexToHtml }) => {
      if (cancelled) return;
      try {
        setHtml(latexToHtml(latexSource));
        setRenderError(false);
      } catch {
        setRenderError(true);
      }
    });

    return () => {
      cancelled = true;
    };
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

    const updated = rebuildLatexFromEditableDom(containerRef.current, latexRef.current);

    if (updated === latexRef.current) return;

    skipHtmlSyncRef.current = true;

    latexRef.current = updated;

    onLatexChange(updated);

  }, [editMode, onLatexChange]);



  const handleEditClick = useCallback(

    (e: React.MouseEvent) => {

      if (!editMode) return;

      const anchor = (e.target as HTMLElement).closest("a");

      if (anchor) e.preventDefault();

    },

    [editMode]

  );



  const handleDownload = async (type: "pdf" | "docx" | "tex" | "txt") => {
    if (isLoaded && !isSignedIn) {
      openSignIn();
      return;
    }

    setDownloading(type);

    try {

      if (type === "pdf") {

        await downloadBlob(
          "/api/export/pdf",
          { latexSource },
          getOptimizedFileName(originalFileName, "pdf")
        );
        trackEvent("pdf_downloaded");

      } else if (type === "docx") {

        if (isPreserve && preservedDocxBase64) {

          await downloadBlob(
            "/api/export/docx-preserve",
            { preservedDocxBase64 },
            getOptimizedFileName(originalFileName, "docx")
          );

        } else {

          await downloadBlob(
            "/api/export/docx",
            { latexSource },
            getOptimizedFileName(originalFileName, "docx")
          );

        }

      } else if (type === "tex") {

        const tex = isPreserve && preservedTexSource ? preservedTexSource : latexSource;

        if (isPreserve && preservedTexSource) {

          downloadText(tex, getOptimizedFileName(originalFileName, "tex"), "application/x-tex");

        } else {

          await downloadBlob(
            "/api/export/tex",
            { latexSource, format: "tex" },
            getOptimizedFileName(originalFileName, "tex")
          );

        }

      } else {

        await downloadBlob(
          "/api/export/tex",
          { latexSource, format: "txt" },
          getOptimizedFileName(originalFileName, "txt")
        );

      }

    } catch (err) {
      if (err instanceof Error && err.message === "quota_exceeded") {
        const quota = (err as Error & { quota?: { used: number; limit: number; resetDate?: string } }).quota;
        setUpgradeMeta({
          used: quota?.used ?? 1,
          limit: quota?.limit ?? 1,
          resetDate: quota?.resetDate ?? "",
        });
        setUpgradeOpen(true);
      } else {
        alert(err instanceof Error ? err.message : "Download failed — try again");
      }
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

            aria-pressed={editMode}

          >

            {editMode ? "Editing on" : "Edit resume"}

          </button>

          <button className="btn btn-secondary btn-sm" onClick={onReoptimize}>

            Optimize another job

          </button>

          <span className={`mode-badge ${isPreserve ? "preserve" : "template"}`}>

            {isPreserve ? "Layout preserved" : "ATS template"}

          </span>

        </div>

        <span className="toolbar-divider" aria-hidden />

        <div className="toolbar-section">

          <button

            className="btn btn-primary btn-sm"

            disabled={!!downloading}

            onClick={() => handleDownload("pdf")}

          >

            {downloading === "pdf" ? "Downloading…" : "Download PDF"}

          </button>

          <button

            className="btn btn-secondary btn-sm"

            disabled={!!downloading}

            onClick={() => handleDownload("docx")}

            title={isPreserve && preservedDocxBase64 ? "Keeps your original DOCX styling" : "HTML-based DOCX export"}

          >

            {downloading === "docx" ? "Downloading…" : "Download DOCX"}

          </button>

          <button

            className="btn btn-secondary btn-sm"

            disabled={!!downloading}

            onClick={() => handleDownload("tex")}

            title={isPreserve && preservedTexSource ? "Your original LaTeX source" : "Jake template .tex"}

          >

            {downloading === "tex" ? "Downloading…" : "Download .tex"}

          </button>

          <button

            className="btn btn-secondary btn-sm"

            disabled={!!downloading}

            onClick={() => handleDownload("txt")}

          >

            {downloading === "txt" ? "Downloading…" : "Download TXT"}

          </button>

        </div>

        {isLoaded && !isSignedIn && (
          <p className="download-signin-hint" role="status">
            Sign in to download PDF, DOCX, or LaTeX
          </p>
        )}
      </div>

      {layoutNote && <p className="layout-note-banner" role="status">{layoutNote}</p>}

      <div className="panel-header">
        Optimized resume
        {isPreserve && preservedDocxBase64 ? (
          <span className="panel-header-sub">Your original layout preserved</span>
        ) : null}
      </div>

      <div className="panel-body">
        {isPreserve && preservedDocxBase64 ? (
          <DocxPdfPreview
            base64={preservedDocxBase64}
            fileName={getOptimizedFileName(originalFileName, "docx")}
            title="Optimized resume with your layout preserved"
          />
        ) : renderError ? (

          <div className="document-view resume-fallback">{latexSource}</div>

        ) : (

          <div

            ref={containerRef}

            className={`resume-page ${editMode ? "edit-mode" : ""}`}

            style={{ minHeight: LETTER_PAGE_HEIGHT * 0.75 }}

            dangerouslySetInnerHTML={{ __html: html }}

            onBlur={syncEdits}

            onClick={handleEditClick}

            suppressContentEditableWarning

          />

        )}

      </div>

      <UpgradeModal
        open={upgradeOpen}
        action="download"
        used={upgradeMeta.used}
        limit={upgradeMeta.limit}
        resetDate={upgradeMeta.resetDate}
        onClose={() => setUpgradeOpen(false)}
      />
    </div>
  );
}

