"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { latexToHtml } from "@/lib/latex-to-html";
import DocxPdfPreview from "@/components/DocxPdfPreview";
import { getOptimizedFileName } from "@/lib/export-filename";
import type { OptimizationMode } from "@/types";

interface OptimizedResumePreviewProps {
  latexSource: string;
  preferPdf?: boolean;
  effectiveMode?: OptimizationMode;
  preservedDocxBase64?: string;
  fileName?: string;
}

function PreviewSkeleton({ label }: { label: string }) {
  return (
    <div className="compare-loading" role="status" aria-live="polite">
      <div className="compare-skeleton" aria-hidden>
        <div className="skeleton skeleton-block" />
        <div className="skeleton skeleton-line" style={{ width: "90%" }} />
      </div>
      <p>{label}</p>
    </div>
  );
}

function HtmlPreview({ latexSource }: { latexSource: string }) {
  try {
    const html = latexToHtml(latexSource);
    return (
      <div className="resume-page compare-resume" dangerouslySetInnerHTML={{ __html: html }} />
    );
  } catch {
    return (
      <div className="compare-fallback" role="alert">
        <p>We couldn&apos;t render the optimized resume.</p>
      </div>
    );
  }
}

export default function OptimizedResumePreview({
  latexSource,
  preferPdf = false,
  effectiveMode = "template",
  preservedDocxBase64,
  fileName,
}: OptimizedResumePreviewProps) {
  const { isSignedIn, isLoaded } = useAuth();
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [useHtmlFallback, setUseHtmlFallback] = useState(true);

  const isPreservedDocx = effectiveMode === "preserve" && Boolean(preservedDocxBase64);

  useEffect(() => {
    if (isPreservedDocx || !preferPdf || !isLoaded || !isSignedIn || !latexSource) {
      setUseHtmlFallback(true);
      return;
    }

    let cancelled = false;
    let objectUrl: string | null = null;

    setUseHtmlFallback(false);
    setPdfLoading(true);
    setPdfUrl(null);

    (async () => {
      try {
        const res = await fetch("/api/export/pdf", {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ latexSource }),
        });
        if (!res.ok) throw new Error("PDF preview failed");
        const blob = await res.blob();
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setPdfUrl(objectUrl);
      } catch {
        if (!cancelled) setUseHtmlFallback(true);
      } finally {
        if (!cancelled) setPdfLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [latexSource, preferPdf, isLoaded, isSignedIn, isPreservedDocx]);

  if (isPreservedDocx && preservedDocxBase64) {
    return (
      <DocxPdfPreview
        base64={preservedDocxBase64}
        fileName={fileName || getOptimizedFileName(undefined, "docx")}
        title="Your optimized resume (layout preserved)"
      />
    );
  }

  if (preferPdf && isLoaded && isSignedIn && !useHtmlFallback) {
    if (pdfLoading || !pdfUrl) {
      return <PreviewSkeleton label="Generating optimized PDF preview…" />;
    }
    return (
      <iframe
        className="compare-file-frame"
        src={pdfUrl}
        title="Your optimized resume (PDF)"
      />
    );
  }

  return <HtmlPreview latexSource={latexSource} />;
}
