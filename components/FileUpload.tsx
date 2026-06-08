"use client";

import { useCallback, useRef, useState } from "react";
import type { DetectedFormat } from "@/types";

interface FileUploadProps {
  file: File | null;
  detectedFormat: DetectedFormat | null;
  onFileSelect: (file: File, format: DetectedFormat) => void;
}

const FORMAT_LABELS: Record<DetectedFormat, string> = {
  pdf: "PDF",
  docx: "DOCX",
  txt: "TXT",
  image: "Image (OCR)",
  unknown: "Unknown",
};

export default function FileUpload({
  file,
  detectedFormat,
  onFileSelect,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFile = useCallback(
    (selected: File) => {
      const ext = selected.name.split(".").pop()?.toLowerCase();
      let format: DetectedFormat = "unknown";
      if (selected.type === "application/pdf" || ext === "pdf") format = "pdf";
      else if (selected.type.includes("wordprocessingml") || ext === "docx") format = "docx";
      else if (selected.type === "text/plain" || ext === "txt") format = "txt";
      else if (selected.type.startsWith("image/") || ["jpg", "jpeg", "png"].includes(ext || ""))
        format = "image";

      onFileSelect(selected, format);
    },
    [onFileSelect]
  );

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleFile(dropped);
  };

  return (
    <div className="panel">
      <div className="panel-header-row">
        <div>
          <h2 className="panel-title">Your resume</h2>
          <p className="panel-desc">PDF, DOCX, TXT, or image</p>
        </div>
        <span className="panel-icon" aria-hidden>📄</span>
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
        aria-label="Upload resume file"
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          className="hidden-input"
          type="file"
          accept=".pdf,.docx,.txt,.jpg,.jpeg,.png,application/pdf,text/plain,image/jpeg,image/png"
          onChange={(e) => {
            const selected = e.target.files?.[0];
            if (selected) handleFile(selected);
          }}
        />
        {file ? (
          <>
            <span className={`badge ${detectedFormat ? "success" : ""}`}>
              {detectedFormat ? FORMAT_LABELS[detectedFormat] : "File"}
            </span>
            <span className="file-name">{file.name}</span>
            <span className="dropzone-hint">Click or drop to replace</span>
          </>
        ) : (
          <>
            <span className="dropzone-icon" aria-hidden>↑</span>
            <span className="dropzone-title">Drag & drop your resume</span>
            <span className="dropzone-hint">or click to browse · max 5MB</span>
          </>
        )}
      </div>
    </div>
  );
}
