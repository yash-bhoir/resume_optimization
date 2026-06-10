"use client";

import { useState } from "react";
import { useAuth, useClerk } from "@clerk/nextjs";
import JobDescriptionInput, { isJobDescriptionReady } from "@/components/JobDescriptionInput";
import LoadingOverlay from "@/components/LoadingOverlay";
import UpgradeModal from "@/components/UpgradeModal";
import { useCreditUsage } from "@/hooks/useCreditUsage";
import { validateJobDescriptionClient } from "@/lib/client-validation";
import {
  getOrCreateSessionId,
  persistSessionToServer,
  saveSessionToStorage,
  type StoredSessionPayload,
} from "@/lib/session-client";
import type { OptimizationMode } from "@/types";
import type { ResumeDocument } from "@/types/resume-document";

interface ReoptimizePanelProps {
  session: StoredSessionPayload;
  isPro: boolean;
  onComplete: (updated: StoredSessionPayload) => void;
}

export default function ReoptimizePanel({ session, isPro, onComplete }: ReoptimizePanelProps) {
  const { isSignedIn, isLoaded } = useAuth();
  const { openSignIn } = useClerk();
  const { refresh: refreshCredits } = useCreditUsage();

  const [jobDescription, setJobDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [upgradeMeta, setUpgradeMeta] = useState({ used: 0, limit: 3, resetDate: "" });

  const canRun = isJobDescriptionReady(jobDescription) && !loading;

  const handleReoptimize = async () => {
    setError(null);
    const jdCheck = validateJobDescriptionClient(jobDescription);
    if (!jdCheck.valid) {
      setError(jdCheck.error || "Invalid job description");
      return;
    }

    if (!isLoaded || !isSignedIn) {
      openSignIn();
      return;
    }

    const effectiveMode: OptimizationMode =
      session.optimizationMode === "preserve" && isPro ? "preserve" : "template";

    if (effectiveMode === "preserve" && !isPro) {
      setError("Preserve layout requires Pro. Your resume will use the ATS template.");
    }

    setLoading(true);

    try {
      const res = await fetch("/api/optimize", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeText: session.rawText,
          jobDescription: jobDescription.trim(),
          optimizationMode: effectiveMode,
          detectedFormat: session.detectedFormat || "pdf",
          sessionId: session.sessionId || getOrCreateSessionId(),
          originalFileName: session.originalFileName,
          ...(effectiveMode === "preserve" && session.originalFileBase64
            ? { originalFileBase64: session.originalFileBase64 }
            : session.preservedDocxBase64
              ? { originalFileBase64: session.preservedDocxBase64 }
              : {}),
          resumeDocument: session.resumeDocument as ResumeDocument | undefined,
        }),
      });

      const data = await res.json();

      if (res.status === 401) {
        openSignIn();
        setError("Sign in to optimize.");
        return;
      }

      if (res.status === 403 && (data.code === "CREDITS_EXCEEDED" || data.code === "QUOTA_EXCEEDED")) {
        setUpgradeMeta({
          used: data.used ?? 0,
          limit: data.limit ?? 3,
          resetDate: data.resetDate ?? "",
        });
        setUpgradeOpen(true);
        setError("You're out of credits.");
        return;
      }

      if (!res.ok) {
        throw new Error(data.error || "Optimization failed");
      }

      const updated: StoredSessionPayload = {
        ...session,
        jobDescription: jobDescription.trim(),
        latexSource: data.latexSource,
        matchScoreBefore: data.matchScoreBefore,
        matchScoreAfter: data.matchScoreAfter,
        atsScoreBefore: data.atsScoreBefore,
        atsScoreAfter: data.atsScoreAfter,
        optimizationGain: data.optimizationGain,
        optimizationPercent: data.optimizationPercent,
        atsBreakdownBefore: data.atsBreakdownBefore,
        atsBreakdownAfter: data.atsBreakdownAfter,
        changeLog: data.changeLog,
        changeItems: data.changeItems,
        pageFit: data.pageFit,
        pageCount: data.pageCount,
        analysisBefore: data.analysisBefore,
        analysisAfter: data.analysisAfter,
        effectiveMode: data.effectiveMode,
        layoutNote: data.layoutNote,
        preservedDocxBase64: data.preservedDocxBase64 ?? session.preservedDocxBase64,
        preservedTexSource: data.preservedTexSource ?? session.preservedTexSource,
        resumeDocument: data.optimizedDocument,
      };

      await saveSessionToStorage(updated);
      persistSessionToServer(updated).catch(() => {});
      refreshCredits();
      onComplete(updated);
      setJobDescription("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Optimization failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <section className="reoptimize-panel" aria-labelledby="reoptimize-heading">
        <h3 id="reoptimize-heading">Optimize for another job</h3>
        <p className="reoptimize-hint">
          Same resume, new job posting — no re-upload needed (uses 1 credit).
        </p>
        <JobDescriptionInput value={jobDescription} onChange={setJobDescription} />
        {error && (
          <p className="reoptimize-error" role="alert">
            {error}
          </p>
        )}
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={handleReoptimize}
          disabled={!canRun}
        >
          {loading ? "Optimizing…" : "Optimize for this job (1 credit)"}
        </button>
      </section>

      {loading && (
        <LoadingOverlay
          title="Tailoring for the new job"
          subtitle="Reusing your uploaded resume"
        />
      )}

      <UpgradeModal
        open={upgradeOpen}
        used={upgradeMeta.used}
        limit={upgradeMeta.limit}
        resetDate={upgradeMeta.resetDate}
        onClose={() => setUpgradeOpen(false)}
      />
    </>
  );
}
