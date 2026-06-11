"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useAuth, useClerk } from "@clerk/nextjs";
import FileUpload from "@/components/FileUpload";
import JobDescriptionInput, { isJobDescriptionReady } from "@/components/JobDescriptionInput";
import OptimizationModeSelector from "@/components/OptimizationModeSelector";
import PageLayoutSelector from "@/components/PageLayoutSelector";
import ProgressIndicator from "@/components/ProgressIndicator";
import StepIndicator from "@/components/StepIndicator";
import LoadingOverlay from "@/components/LoadingOverlay";
import { useOptimizeProgress } from "@/hooks/useOptimizeProgress";
import UpgradeModal from "@/components/UpgradeModal";
import UsageCounter from "@/components/UsageCounter";
import { useCreditUsage } from "@/hooks/useCreditUsage";
import { trackEvent } from "@/components/Analytics";
import {
  getOrCreateSessionId,
  loadJobDescriptionDraft,
  persistSessionToServer,
  saveJobDescriptionDraft,
  saveSessionToStorage,
  saveOriginalUploadFile,
} from "@/lib/session-client";
import { getPreserveLayoutNote } from "@/lib/preserve-layout-utils";
import { validateJobDescriptionClient } from "@/lib/client-validation";
import { fileToBase64 } from "@/lib/file-base64";
import type { DetectedFormat, OptimizationMode, OptimizeStep, PageLayoutMode } from "@/types";
import type { ResumeAnalysis } from "@/types";
import ParseReviewPanel, { reparseTextToDocument } from "@/components/ParseReviewPanel";
import type { ResumeDocument } from "@/types/resume-document";

function getCurrentStep(
  parsedText: string | null,
  step: OptimizeStep,
  hasJobDescription: boolean
): 1 | 2 | 3 {
  if (step === "optimizing" || step === "rendering" || step === "done") return 3;
  if (parsedText && hasJobDescription) return 3;
  if (parsedText) return 2;
  return 1;
}

function getErrorFix(message: string): string | null {
  if (message.includes("Sign in") || message.includes("UNAUTHORIZED")) {
    return "Sign in to download your optimized resume.";
  }
  if (message.includes("credit") || message.includes("quota") || message.includes("limit")) {
    return "Upgrade to Pro or buy a credit pack on the pricing page.";
  }
  if (message.includes("Sign in") || message.includes("UNAUTHORIZED")) {
    return "Create a free account to optimize — includes monthly credits.";
  }
  if (message.includes("upload") || message.includes("PDF") || message.includes("DOCX")) {
    return "Choose a PDF or DOCX file under 5 MB.";
  }
  if (message.includes("job description") || message.includes("50 characters")) {
    return "Paste the full job posting — at least 50 characters and 10 words.";
  }
  if (message.includes("parse") || message.includes("extract")) {
    return "Try a text-based PDF or upload a DOCX instead.";
  }
  return "Check your connection and try again.";
}

export default function HomeUploadTool() {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useAuth();
  const { openSignIn } = useClerk();
  const { isPro } = useCreditUsage();

  const [file, setFile] = useState<File | null>(null);
  const [detectedFormat, setDetectedFormat] = useState<DetectedFormat | null>(null);
  const [parsedText, setParsedText] = useState<string | null>(null);
  const [resumeDocument, setResumeDocument] = useState<ResumeDocument | null>(null);
  const [originalFileBase64, setOriginalFileBase64] = useState<string | undefined>();
  const [originalFileName, setOriginalFileName] = useState<string | undefined>();
  const [preserveLayoutNote, setPreserveLayoutNote] = useState<string | undefined>();
  const [scannedWarning, setScannedWarning] = useState<string | undefined>();
  const [optimizationMode, setOptimizationMode] = useState<OptimizationMode>("template");
  const [pageLayout, setPageLayout] = useState<PageLayoutMode>("balanced");
  const [jobDescription, setJobDescription] = useState("");
  const [step, setStep] = useState<OptimizeStep>("idle");
  const optimizeProgressHint = useOptimizeProgress(step === "optimizing");
  const [error, setError] = useState<string | null>(null);
  const [scorePreview, setScorePreview] = useState<{
    matchScoreBefore: number;
    atsScoreBefore: number;
    analysisBefore?: ResumeAnalysis;
  } | null>(null);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [pricingConfig, setPricingConfig] = useState({
    freeCreditsPerMonth: 3,
    signupBonusCredits: 1,
    requireSignInToOptimize: true,
  });
  const [upgradeMeta, setUpgradeMeta] = useState({
    action: "credits" as "optimize" | "download" | "credits",
    used: 3,
    limit: 3,
    resetDate: "",
  });
  const [pendingDocxPreserveDefault, setPendingDocxPreserveDefault] = useState(false);

  useEffect(() => {
    if (pendingDocxPreserveDefault && isPro && detectedFormat === "docx") {
      setOptimizationMode("preserve");
      setPendingDocxPreserveDefault(false);
    }
  }, [pendingDocxPreserveDefault, isPro, detectedFormat]);

  useEffect(() => {
    fetch("/api/pricing-config")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          setPricingConfig({
            freeCreditsPerMonth: data.freeCreditsPerMonth ?? 3,
            signupBonusCredits: data.signupBonusCredits ?? 1,
            requireSignInToOptimize: data.requireSignInToOptimize ?? false,
          });
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setJobDescription(loadJobDescriptionDraft());
  }, []);

  const hasJobDescription = isJobDescriptionReady(jobDescription);

  const currentStep = useMemo(
    () => getCurrentStep(parsedText, step, hasJobDescription),
    [parsedText, step, hasJobDescription]
  );

  const fetchScorePreview = async (text: string, jd: string) => {
    if (!isJobDescriptionReady(jd)) return;
    try {
      const res = await fetch("/api/score-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText: text, jobDescription: jd.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setScorePreview({
          matchScoreBefore: data.matchScoreBefore,
          atsScoreBefore: data.atsScoreBefore,
          analysisBefore: data.analysisBefore,
        });
      }
    } catch {
      /* preview is optional */
    }
  };

  useEffect(() => {
    if (parsedText && hasJobDescription) {
      fetchScorePreview(parsedText, jobDescription);
    } else {
      setScorePreview(null);
    }
  }, [parsedText, jobDescription, hasJobDescription]);

  const handleJobDescriptionChange = (value: string) => {
    setJobDescription(value);
    saveJobDescriptionDraft(value);
  };

  const parseUploadedFile = async (f: File) => {
    setStep("parsing");
    const formData = new FormData();
    formData.append("file", f);

    const parseRes = await fetch("/api/parse-resume", { method: "POST", body: formData });
    const parseData = await parseRes.json();

    if (!parseRes.ok) {
      const fieldError =
        parseData.fields &&
        Object.values(parseData.fields as Record<string, string>)[0];
      throw new Error(fieldError || parseData.error || "We couldn't read that file");
    }

    setParsedText(parseData.rawText);
    setDetectedFormat(parseData.detectedFormat);
    setResumeDocument(parseData.resumeDocument);
    setOriginalFileBase64(parseData.originalFileBase64);
    setPreserveLayoutNote(parseData.preserveLayoutNote);
    setScannedWarning(parseData.scannedWarning);
    await saveOriginalUploadFile(f);
    trackEvent("resume_uploaded", { format: parseData.detectedFormat });
    setStep("idle");
  };

  const handleFileSelect = async (f: File, format: DetectedFormat) => {
    setError(null);
    setFile(f);
    setDetectedFormat(format);
    setParsedText(null);
    setResumeDocument(null);
    setOriginalFileBase64(undefined);
    setOriginalFileName(f.name);
    setPreserveLayoutNote(undefined);
    setScannedWarning(undefined);
    setScorePreview(null);
    setPendingDocxPreserveDefault(format === "docx");

    try {
      await parseUploadedFile(f);
    } catch (err) {
      setStep("error");
      setError(err instanceof Error ? err.message : "We couldn't read that file");
    }
  };

  const handleOptimize = async () => {
    setError(null);

    if (!isLoaded) {
      setError("Checking sign-in status… try again in a moment.");
      return;
    }

    if (!parsedText) {
      setError("Upload your resume before optimizing.");
      return;
    }

    const jdCheck = validateJobDescriptionClient(jobDescription);
    if (!jdCheck.valid) {
      setError(jdCheck.error || "Paste the full job description before optimizing.");
      return;
    }

    if (optimizationMode === "preserve" && !isPro) {
      setError("Preserve layout is a Pro feature. Switch to ATS template or upgrade.");
      return;
    }

    if (pricingConfig.requireSignInToOptimize && !isSignedIn) {
      openSignIn();
      setError("Sign in to optimize your resume. Free accounts get monthly credits.");
      return;
    }

    try {
      setStep("optimizing");
      trackEvent("optimization_started");

      const effectiveMode =
        optimizationMode === "preserve" && isPro ? "preserve" : "template";

      let preserveFileBase64 = originalFileBase64;
      if (effectiveMode === "preserve" && !preserveFileBase64 && file) {
        preserveFileBase64 = await fileToBase64(file);
      }

      const optimizeController = new AbortController();
      const optimizeTimeout = setTimeout(() => optimizeController.abort(), 130_000);

      let optimizeRes: Response;
      try {
        optimizeRes = await fetch("/api/optimize", {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          signal: optimizeController.signal,
          body: JSON.stringify({
            resumeText: parsedText,
            jobDescription: jobDescription.trim(),
            optimizationMode: effectiveMode,
            detectedFormat: detectedFormat || "pdf",
            sessionId: getOrCreateSessionId(),
            originalFileName: file?.name || originalFileName,
            ...(originalFileBase64 ? { originalFileBase64 } : {}),
            ...(effectiveMode === "preserve" && preserveFileBase64 && !originalFileBase64
              ? { originalFileBase64: preserveFileBase64 }
              : {}),
            resumeDocument,
            pageLayout,
          }),
        });
      } catch (fetchErr) {
        if (fetchErr instanceof Error && fetchErr.name === "AbortError") {
          throw new Error(
            "Optimization timed out after 2 minutes. Try again — if it keeps failing, use a shorter job description."
          );
        }
        throw fetchErr;
      } finally {
        clearTimeout(optimizeTimeout);
      }

      const optimizeData = await optimizeRes.json();

      if (optimizeRes.status === 401) {
        openSignIn();
        setError(
          optimizeData.code === "LOGIN_REQUIRED"
            ? "Sign in to optimize. After signing in, click Optimize again."
            : "Sign in to optimize your resume."
        );
        setStep("error");
        return;
      }

      if (optimizeRes.status === 429 || optimizeData.code === "RATE_LIMITED") {
        setStep("error");
        setError(
          "Too many optimization attempts this hour. Wait about an hour and try again, or ask an admin to raise the limit."
        );
        return;
      }

      if (
        optimizeRes.status === 403 &&
        optimizeData.code === "PRO_REQUIRED"
      ) {
        setStep("error");
        setError("Keep my layout is a Pro feature. Switch to ATS template or upgrade on the pricing page.");
        return;
      }

      if (
        optimizeRes.status === 403 &&
        (optimizeData.code === "CREDITS_EXCEEDED" || optimizeData.code === "QUOTA_EXCEEDED")
      ) {
        setUpgradeMeta({
          action: "credits",
          used: optimizeData.used ?? pricingConfig.freeCreditsPerMonth,
          limit: optimizeData.limit ?? pricingConfig.freeCreditsPerMonth,
          resetDate: optimizeData.resetDate ?? "",
        });
        setUpgradeOpen(true);
        trackEvent("upgrade_clicked", { reason: "credits_exceeded" });
        setStep("error");
        setError("You're out of credits for this month.");
        return;
      }

      if (!optimizeRes.ok) {
        const fieldError =
          optimizeData.fields &&
          Object.values(optimizeData.fields as Record<string, string>)[0];
        throw new Error(fieldError || optimizeData.error || "Optimization didn't complete");
      }

      setStep("rendering");
      trackEvent("optimization_completed", {
        matchGain: optimizeData.optimizationGain,
      });

      const sessionPayload = {
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
        optimizationMode,
        effectiveMode: optimizeData.effectiveMode,
        layoutNote: optimizeData.layoutNote,
        preservedDocxBase64: optimizeData.preservedDocxBase64,
        preservedTexSource: optimizeData.preservedTexSource,
        resumeDocument: optimizeData.optimizedDocument,
        originalFileBase64,
        originalFileName: file?.name || originalFileName,
      };

      await saveSessionToStorage(sessionPayload, file);

      if (isSignedIn) {
        persistSessionToServer(sessionPayload).catch(() => {});
      }

      saveJobDescriptionDraft(jobDescription.trim());
      setStep("done");
      router.push("/results");
    } catch (err) {
      setStep("error");
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  };

  const isLoading = ["parsing", "optimizing", "rendering"].includes(step);
  const canOptimize = Boolean(parsedText) && hasJobDescription;
  const errorFix = error ? getErrorFix(error) : null;

  const formatNote =
    detectedFormat && optimizationMode === "preserve"
      ? preserveLayoutNote || getPreserveLayoutNote(detectedFormat)
      : undefined;

  return (
    <>
      <UsageCounter />
      <StepIndicator current={currentStep} />

      {error && (
        <div className="error-banner" role="alert">
          <span className="error-banner-title">{error}</span>
          {errorFix && <span className="error-banner-fix">{errorFix}</span>}
        </div>
      )}

      {scannedWarning && (
        <div className="warning-banner" role="status">
          {scannedWarning}
        </div>
      )}

      <div className="upload-grid" id="upload">
        <FileUpload
          file={file}
          detectedFormat={detectedFormat}
          onFileSelect={handleFileSelect}
        />
        <JobDescriptionInput value={jobDescription} onChange={handleJobDescriptionChange} />
      </div>

      {scorePreview && parsedText && (
        <div className="score-preview-panel" role="status">
          <h3>Your ATS match preview</h3>
          <div className="score-preview-chips">
            <span className="stat-chip">
              <span className="stat-value">{scorePreview.matchScoreBefore}%</span>
              <span className="stat-label">Keyword match</span>
            </span>
            <span className="stat-chip">
              <span className="stat-value">{scorePreview.atsScoreBefore}</span>
              <span className="stat-label">ATS score</span>
            </span>
          </div>
          <p className="score-preview-hint">
            Sign in to optimize (uses 1 credit). Free: {pricingConfig.freeCreditsPerMonth}/month +
            {pricingConfig.signupBonusCredits} signup bonus. Downloads included.
          </p>
        </div>
      )}

      {parsedText && step !== "parsing" && (
        <ParseReviewPanel
          text={parsedText}
          onChange={(text) => {
            setParsedText(text);
            setResumeDocument(reparseTextToDocument(text));
            setScorePreview(null);
          }}
        />
      )}

      {parsedText && step !== "parsing" && detectedFormat === "pdf" && (
        <p className="mode-panel-desc mode-layout-warning" role="status">
          PDF uploads use our ATS template for best parsing. To <strong>keep your exact Word design</strong>,
          upload a <strong>DOCX</strong> and choose Keep my layout (Pro).
        </p>
      )}

      {parsedText && step !== "parsing" && (
        <>
          {detectedFormat === "docx" && !isPro && optimizationMode === "template" && (
            <p className="mode-panel-desc mode-layout-warning" role="status">
              ATS template mode reformats your resume into a standard layout. Upgrade to Pro and
              choose <strong>Keep my layout</strong> to keep your Word design.
            </p>
          )}
          {detectedFormat === "docx" && isPro && optimizationMode === "preserve" && (
            <p className="mode-panel-desc mode-layout-note" role="status">
              Keep my layout is selected — fonts, colors, and structure from your DOCX will stay
              the same. Only the text is tailored to the job.
            </p>
          )}
        <OptimizationModeSelector
          mode={optimizationMode}
          format={detectedFormat}
          preserveNote={formatNote}
          isPro={isPro}
          isSignedIn={isLoaded && isSignedIn}
          onChange={setOptimizationMode}
        />
        <PageLayoutSelector value={pageLayout} onChange={setPageLayout} disabled={isLoading} />
        </>
      )}

      <div className="actions">
        <button
          className="btn btn-primary"
          onClick={handleOptimize}
          disabled={!canOptimize || isLoading}
          title={
            !parsedText
              ? "Upload your resume first"
              : !hasJobDescription
                ? "Paste the full job description (50+ characters)"
                : undefined
          }
        >
          {step === "parsing"
            ? "Reading resume…"
            : isLoading
              ? "Optimizing…"
              : isLoaded && !isSignedIn
                ? "Sign in to optimize"
                : "Optimize for this job (1 credit)"}
        </button>
        <ProgressIndicator step={step} />
      </div>

      {isLoading && (
        <LoadingOverlay
          title={
            step === "parsing"
              ? "Reading your resume"
              : step === "optimizing"
                ? "Tailoring content to the job"
                : "Building your results"
          }
          subtitle={
            step === "optimizing"
              ? undefined
              : step === "parsing"
                ? "Extracting text from your file"
                : "Saving your optimized resume"
          }
          progressHint={step === "optimizing" ? optimizeProgressHint : undefined}
        />
      )}

      <UpgradeModal
        open={upgradeOpen}
        action={upgradeMeta.action}
        used={upgradeMeta.used}
        limit={upgradeMeta.limit}
        resetDate={upgradeMeta.resetDate}
        onClose={() => setUpgradeOpen(false)}
      />
    </>
  );
}
