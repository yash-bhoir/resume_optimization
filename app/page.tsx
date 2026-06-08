"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import AppHeader from "@/components/AppHeader";
import FileUpload from "@/components/FileUpload";
import JobDescriptionInput from "@/components/JobDescriptionInput";
import ProgressIndicator from "@/components/ProgressIndicator";
import ResumeReviewPanel from "@/components/ResumeReviewPanel";
import StepIndicator from "@/components/StepIndicator";
import LoadingOverlay from "@/components/LoadingOverlay";
import {
  loadJobDescriptionDraft,
  saveJobDescriptionDraft,
  saveSessionToStorage,
} from "@/lib/session-client";
import type { DetectedFormat, OptimizeStep } from "@/types";

function getCurrentStep(
  parsedText: string | null,
  resumeConfirmed: boolean,
  step: OptimizeStep
): 1 | 2 | 3 | 4 {
  if (step === "optimizing" || step === "rendering" || step === "done") return 4;
  if (resumeConfirmed && parsedText) return 4;
  if (parsedText) return 2;
  return 1;
}

export default function UploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [detectedFormat, setDetectedFormat] = useState<DetectedFormat | null>(null);
  const [parsedText, setParsedText] = useState<string | null>(null);
  const [resumeConfirmed, setResumeConfirmed] = useState(false);
  const [jobDescription, setJobDescription] = useState("");
  const [step, setStep] = useState<OptimizeStep>("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setJobDescription(loadJobDescriptionDraft());
  }, []);

  const currentStep = useMemo(
    () => getCurrentStep(parsedText, resumeConfirmed, step),
    [parsedText, resumeConfirmed, step]
  );

  const handleJobDescriptionChange = (value: string) => {
    setJobDescription(value);
    saveJobDescriptionDraft(value);
  };

  const handleFileSelect = (f: File, format: DetectedFormat) => {
    setFile(f);
    setDetectedFormat(format);
    setParsedText(null);
    setResumeConfirmed(false);
    setStep("idle");
  };

  const handleParse = async () => {
    setError(null);
    if (!file) {
      setError("Please upload your resume first.");
      return;
    }

    try {
      setStep("parsing");
      const formData = new FormData();
      formData.append("file", file);

      const parseRes = await fetch("/api/parse-resume", {
        method: "POST",
        body: formData,
      });
      const parseData = await parseRes.json();
      if (!parseRes.ok) {
        throw new Error(parseData.error || "Failed to parse resume");
      }

      setParsedText(parseData.rawText);
      setDetectedFormat(parseData.detectedFormat);
      setResumeConfirmed(false);
      setStep("review");
    } catch (err) {
      setStep("error");
      setError(err instanceof Error ? err.message : "Failed to parse resume");
    }
  };

  const handleOptimize = async () => {
    setError(null);

    if (!parsedText) {
      setError("Please parse and review your resume first.");
      return;
    }
    if (!resumeConfirmed) {
      setError("Please confirm your resume is complete before optimizing.");
      return;
    }
    if (jobDescription.trim().length < 20) {
      setError("Please paste a complete job description (at least 20 characters).");
      return;
    }

    try {
      setStep("optimizing");
      const optimizeRes = await fetch("/api/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeText: parsedText,
          jobDescription: jobDescription.trim(),
        }),
      });
      const optimizeData = await optimizeRes.json();
      if (!optimizeRes.ok) {
        throw new Error(optimizeData.error || "Failed to optimize resume");
      }

      setStep("rendering");

      saveSessionToStorage({
        rawText: parsedText,
        jobDescription: jobDescription.trim(),
        latexSource: optimizeData.latexSource,
        matchScoreBefore: optimizeData.matchScoreBefore,
        matchScoreAfter: optimizeData.matchScoreAfter,
        atsScoreBefore: optimizeData.atsScoreBefore,
        atsScoreAfter: optimizeData.atsScoreAfter,
        optimizationGain: optimizeData.optimizationGain,
        optimizationPercent: optimizeData.optimizationPercent,
        atsBreakdownBefore: optimizeData.atsBreakdownBefore,
        atsBreakdownAfter: optimizeData.atsBreakdownAfter,
        changeLog: optimizeData.changeLog,
        changeItems: optimizeData.changeItems,
        pageFit: optimizeData.pageFit,
        pageCount: optimizeData.pageCount,
        analysisBefore: optimizeData.analysisBefore,
        analysisAfter: optimizeData.analysisAfter,
        detectedFormat: detectedFormat || undefined,
      });
      saveJobDescriptionDraft(jobDescription.trim());

      setStep("done");
      router.push("/results");
    } catch (err) {
      setStep("error");
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  };

  const isLoading = ["parsing", "optimizing", "rendering"].includes(step);
  const canOptimize = resumeConfirmed && parsedText && jobDescription.trim().length >= 20;

  return (
    <div className="app-shell">
      <AppHeader />

      <main className="app-main">
        <header className="hero">
          <span className="hero-badge">AI-powered · ATS-optimized</span>
          <h1>Tailor your resume to any job</h1>
          <p>
            Upload your resume, review the parsed content, paste a job description,
            and get a professionally formatted, JD-optimized resume with before/after scores.
          </p>
          <div className="hero-features">
            <span>Professional template</span>
            <span>ATS score report</span>
            <span>No login required</span>
          </div>
        </header>

        <StepIndicator current={currentStep} />

        {error && <div className="error-banner" role="alert">{error}</div>}

        <div className="upload-grid">
          <FileUpload
            file={file}
            detectedFormat={detectedFormat}
            onFileSelect={handleFileSelect}
          />
          <JobDescriptionInput value={jobDescription} onChange={handleJobDescriptionChange} />
        </div>

        {parsedText && step !== "parsing" && (
          <ResumeReviewPanel
            rawText={parsedText}
            detectedFormat={detectedFormat}
            confirmed={resumeConfirmed}
            onConfirm={() => setResumeConfirmed(true)}
            onEdit={() => {
              setFile(null);
              setParsedText(null);
              setResumeConfirmed(false);
              setStep("idle");
            }}
          />
        )}

        <div className="actions">
          {!parsedText ? (
            <button
              className="btn btn-primary"
              onClick={handleParse}
              disabled={!file || isLoading}
            >
              {step === "parsing" ? "Parsing resume…" : "Parse & review resume"}
            </button>
          ) : (
            <button
              className="btn btn-primary"
              onClick={handleOptimize}
              disabled={!canOptimize || isLoading}
              title={
                !resumeConfirmed
                  ? "Confirm your resume first"
                  : jobDescription.trim().length < 20
                    ? "Add a job description"
                    : undefined
              }
            >
              {isLoading ? "Optimizing…" : "Optimize for this job"}
            </button>
          )}
          <ProgressIndicator step={step} />
        </div>
      </main>

      <footer className="app-footer">
        Resume Optimizer — strengthen your resume for ATS and recruiters
      </footer>

      {isLoading && (
        <LoadingOverlay
          title={
            step === "parsing"
              ? "Reading your complete resume"
              : "Optimizing for maximum selection chance"
          }
          subtitle="This may take up to 60 seconds"
        />
      )}
    </div>
  );
}
