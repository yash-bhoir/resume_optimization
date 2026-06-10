"use client";

import { useEffect, useState } from "react";

interface DocxPdfPreviewProps {
  blob?: Blob | null;
  base64?: string;
  fileName?: string;
  title?: string;
  onFailed?: () => void;
}

function PreviewSkeleton({ label }: { label: string }) {
  return (
    <div className="compare-loading" role="status" aria-live="polite">
      <div className="compare-skeleton" aria-hidden>
        <div className="skeleton skeleton-block" />
        <div className="skeleton skeleton-line" style={{ width: "90%" }} />
        <div className="skeleton skeleton-line" style={{ width: "75%" }} />
      </div>
      <p>{label}</p>
    </div>
  );
}

function base64ToDocxBlob(base64: string): Blob {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], {
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });
}

export default function DocxPdfPreview({
  blob,
  base64,
  fileName = "resume.docx",
  title = "Resume preview",
  onFailed,
}: DocxPdfPreviewProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;

    (async () => {
      setLoading(true);
      setFailed(false);
      setPdfUrl(null);

      try {
        const docxBlob = blob || (base64 ? base64ToDocxBlob(base64) : null);
        if (!docxBlob) throw new Error("No DOCX data");

        const formData = new FormData();
        formData.append("file", docxBlob, fileName.endsWith(".docx") ? fileName : `${fileName}.docx`);

        const res = await fetch("/api/preview/docx", {
          method: "POST",
          credentials: "same-origin",
          body: formData,
        });
        if (!res.ok) throw new Error("Preview failed");

        const pdfBlob = await res.blob();
        if (cancelled) return;
        objectUrl = URL.createObjectURL(pdfBlob);
        setPdfUrl(objectUrl);
      } catch {
        if (!cancelled) {
          setFailed(true);
          onFailed?.();
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [blob, base64, fileName]);

  if (loading) return <PreviewSkeleton label="Preparing document preview…" />;
  if (failed || !pdfUrl) {
    return (
      <div className="compare-fallback" role="status">
        <p>Couldn&apos;t preview this DOCX. Download the file to view your layout.</p>
      </div>
    );
  }

  return <iframe className="compare-file-frame" src={pdfUrl} title={title} />;
}
