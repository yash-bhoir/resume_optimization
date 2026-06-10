"use client";

import { useEffect, useState } from "react";
import { sanitizeHtml } from "@/lib/sanitize-html";
import { latexToHtml } from "@/lib/latex-to-html";
import { inferFormatFromFileName, mimeForFormat } from "@/lib/file-preview";
import { loadOriginalUploadBlob } from "@/lib/session-binary";
import DocxPdfPreview from "@/components/DocxPdfPreview";
import { isLatexSource } from "@/lib/resume-text";
import type { DetectedFormat } from "@/types";

interface OriginalResumePreviewProps {
  format?: DetectedFormat | string;
  fileName?: string;
  originalFileBase64?: string;
  originalTexSource?: string;
  rawText?: string;
}

function PreviewSkeleton({ label }: { label: string }) {
  return (
    <div className="compare-loading" role="status" aria-live="polite">
      <div className="compare-skeleton" aria-hidden>
        <div className="skeleton skeleton-block" />
        <div className="skeleton skeleton-line" style={{ width: "90%" }} />
        <div className="skeleton skeleton-line" style={{ width: "75%" }} />
        <div className="skeleton skeleton-line" style={{ width: "60%" }} />
      </div>
      <p>{label}</p>
    </div>
  );
}

function FileMissingFallback({
  fileName,
  format,
}: {
  fileName?: string;
  format: DetectedFormat;
}) {
  const label = format === "pdf" ? "PDF" : format === "docx" ? "DOCX" : "file";
  return (
    <div className="compare-fallback compare-file-missing" role="status">
      <p>
        <strong>{fileName || `Your ${label}`}</strong> preview isn&apos;t available in this
        browser session.
      </p>
      <p>
        Upload and optimize again in this tab to see your original {label} side-by-side with the
        optimized version.
      </p>
    </div>
  );
}

export default function OriginalResumePreview({
  format = "unknown",
  fileName,
  originalFileBase64,
  originalTexSource,
  rawText,
}: OriginalResumePreviewProps) {
  const [uploadBlob, setUploadBlob] = useState<Blob | null>(null);
  const [resolvedFileName, setResolvedFileName] = useState<string | undefined>(fileName);
  const [binaryLoading, setBinaryLoading] = useState(true);
  const [docxHtml, setDocxHtml] = useState<string | null>(null);
  const [docxError, setDocxError] = useState(false);
  const [docxPdfFailed, setDocxPdfFailed] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const inferred = inferFormatFromFileName(resolvedFileName || fileName);
  const detected: DetectedFormat =
    (format as DetectedFormat) !== "unknown"
      ? ((format as DetectedFormat) || "unknown")
      : inferred || "unknown";
  const expectsFilePreview = detected === "pdf" || detected === "docx" || detected === "image";

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const loaded = await loadOriginalUploadBlob();
      if (cancelled) return;

      if (loaded) {
        setUploadBlob(loaded.blob);
        setResolvedFileName(loaded.fileName || fileName);
        setBinaryLoading(false);
        return;
      }

      if (originalFileBase64) {
        const mime = mimeForFormat(detected, fileName);
        const binary = atob(originalFileBase64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        setUploadBlob(new Blob([bytes], { type: mime }));
        setBinaryLoading(false);
        return;
      }

      setBinaryLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [originalFileBase64, detected, fileName]);

  useEffect(() => {
    if (!uploadBlob) return;
    const url = URL.createObjectURL(uploadBlob);
    setPreviewUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [uploadBlob]);

  useEffect(() => {
    if (detected !== "docx" || !uploadBlob || !docxPdfFailed) return;

    let cancelled = false;
    (async () => {
      try {
        const mammoth = await import("mammoth");
        const buffer = await uploadBlob.arrayBuffer();
        const result = await mammoth.convertToHtml({ arrayBuffer: buffer });
        if (!cancelled) setDocxHtml(sanitizeHtml(result.value));
      } catch {
        if (!cancelled) setDocxError(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [detected, uploadBlob, docxPdfFailed]);

  if (binaryLoading && expectsFilePreview) {
    return <PreviewSkeleton label="Loading your uploaded file…" />;
  }

  if (detected === "pdf" && uploadBlob && previewUrl) {
    return (
      <iframe
        className="compare-file-frame"
        src={previewUrl}
        title={
          resolvedFileName
            ? `Your uploaded resume: ${resolvedFileName}`
            : "Your uploaded resume (PDF)"
        }
      />
    );
  }

  if (detected === "image" && previewUrl) {
    return (
      <div className="compare-image-wrap">
        <img className="compare-image" src={previewUrl} alt="Your uploaded resume" />
      </div>
    );
  }

  if (detected === "docx" && uploadBlob) {
    if (!docxPdfFailed) {
      return (
        <DocxPdfPreview
          blob={uploadBlob}
          fileName={resolvedFileName || fileName || "resume.docx"}
          title={
            resolvedFileName
              ? `Your uploaded resume: ${resolvedFileName}`
              : "Your uploaded resume (DOCX)"
          }
          onFailed={() => setDocxPdfFailed(true)}
        />
      );
    }

    if (docxError) {
      return <FileMissingFallback fileName={resolvedFileName || fileName} format="docx" />;
    }
    if (!docxHtml) {
      return <PreviewSkeleton label="Loading your uploaded resume…" />;
    }
    return (
      <div className="compare-docx-page-wrap">
        <div
          className="resume-page compare-docx-preview"
          dangerouslySetInnerHTML={{ __html: docxHtml }}
        />
      </div>
    );
  }

  if ((detected === "tex" || isLatexSource(originalTexSource || "")) && originalTexSource) {
    try {
      const html = latexToHtml(originalTexSource);
      return (
        <div className="resume-page compare-resume" dangerouslySetInnerHTML={{ __html: html }} />
      );
    } catch {
      /* fall through */
    }
  }

  if (detected === "txt" && uploadBlob) {
    return (
      <TxtBlobPreview blob={uploadBlob} />
    );
  }

  if (expectsFilePreview) {
    return <FileMissingFallback fileName={resolvedFileName || fileName} format={detected} />;
  }

  if (rawText) {
    return (
      <div className="compare-extracted-text">
        <p className="compare-extracted-label">
          Extracted text{fileName ? ` from ${fileName}` : ""} — not a formatted preview
        </p>
        <div className="resume-page compare-txt-preview">
          {rawText.split(/\r?\n/).map((line, i) => (
            <div key={i} className="diff-line">
              {line || "\u00A0"}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="compare-fallback" role="status">
      <p>Original file isn&apos;t available in this session.</p>
      <p>Start a new optimization to compare your upload side by side.</p>
    </div>
  );
}

function TxtBlobPreview({ blob }: { blob: Blob }) {
  const [text, setText] = useState<string | null>(null);

  useEffect(() => {
    blob.text().then(setText);
  }, [blob]);

  if (!text) return <PreviewSkeleton label="Loading…" />;

  return (
    <div className="resume-page compare-txt-preview">
      {text.split(/\r?\n/).map((line, i) => (
        <div key={i} className="diff-line">
          {line || "\u00A0"}
        </div>
      ))}
    </div>
  );
}
