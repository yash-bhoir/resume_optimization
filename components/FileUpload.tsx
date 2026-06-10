"use client";

import { useCallback, useRef, useState } from "react";
import { validateFileClient } from "@/lib/client-validation";
import type { DetectedFormat } from "@/types";

interface FileUploadProps {
  file: File | null;
  detectedFormat: DetectedFormat | null;
  onFileSelect: (file: File, format: DetectedFormat) => void;
}

function UploadIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M10 13V4M10 4L6.5 7.5M10 4l3.5 3.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 14v1.5A1.5 1.5 0 0 0 5.5 17h9A1.5 1.5 0 0 0 16 15.5V14" strokeLinecap="round" />
    </svg>
  );
}

function DocumentIcon() {
  return (
    <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path d="M4 2.5h7l3.5 3.5V15.5A1 1 0 0 1 13.5 16.5h-9A1 1 0 0 1 3.5 15.5v-12A1 1 0 0 1 4.5 2.5z" />
      <path d="M11 2.5v4h4" />
    </svg>
  );
}

export default function FileUpload({
  file,
  detectedFormat,
  onFileSelect,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFile = useCallback(
    (selected: File) => {
      setUploadError(null);
      const validation = validateFileClient(selected);
      if (!validation.valid || !validation.format) {
        setUploadError(validation.error || "Invalid file");
        return;
      }
      onFileSelect(selected, validation.format);
    },
    [onFileSelect]
  );

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const dropped = e.dataTransfer.files;
    if (dropped.length > 1) {
      setUploadError("Upload one resume file at a time.");
      return;
    }
    const file = dropped[0];
    if (file) handleFile(file);
  };

  return (
    <div className="panel">
      <div className="panel-header-row">
        <div>
          <h2 className="panel-title">Your resume</h2>
          <p className="panel-desc">PDF, DOCX, or photo (JPG/PNG) — max 5 MB</p>
        </div>
        <span className="panel-icon" aria-hidden>
          <DocumentIcon />
        </span>
      </div>

      <div
        className={`dropzone ${dragActive ? "active" : ""} ${file ? "has-file" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        aria-label={file ? `Replace ${file.name}` : "Upload resume file"}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
      >
        <input
          ref={inputRef}
          className="hidden-input"
          type="file"
          accept=".pdf,.docx,.jpg,.jpeg,.png,.webp,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/jpeg,image/png,image/webp"
          onChange={(e) => {
            const selected = e.target.files;
            if (selected && selected.length > 1) {
              setUploadError("Upload one resume file at a time.");
              return;
            }
            const f = selected?.[0];
            if (f) handleFile(f);
            e.target.value = "";
          }}
        />
        {file ? (
          <>
            <span className={`badge ${detectedFormat ? "success" : ""}`}>
              {detectedFormat === "pdf" ? "PDF" : detectedFormat === "docx" ? "DOCX" : "File"}
            </span>
            <span className="file-name">{file.name}</span>
            <span className="dropzone-hint">Tap or drop a different file to replace</span>
          </>
        ) : (
          <>
            <span className="dropzone-icon" aria-hidden>
              <UploadIcon />
            </span>
            <span className="dropzone-title">Drop your resume here</span>
            <span className="dropzone-hint">PDF, DOCX, or JPG/PNG — 5 MB max</span>
          </>
        )}
      </div>

      {uploadError && (
        <p className="field-error" role="alert">
          {uploadError}
        </p>
      )}
    </div>
  );
}
