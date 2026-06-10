"use client";

import Link from "next/link";
import { SignInButton } from "@clerk/nextjs";

export type LoginWallFeature = "optimization" | "download" | "diff";

const COPY: Record<
  LoginWallFeature,
  { title: string; benefit: string; cta: string }
> = {
  optimization: {
    title: "See your full optimization",
    benefit: "Sign in free to view your tailored resume, change log, and detailed report.",
    cta: "Sign in free",
  },
  download: {
    title: "Download your resume",
    benefit: "Create a free account to export PDF, DOCX, or LaTeX.",
    cta: "Sign in to download",
  },
  diff: {
    title: "Compare side by side",
    benefit: "Sign in free to see exactly what changed between your original and optimized resume.",
    cta: "Sign in free",
  },
};

interface LoginWallProps {
  feature: LoginWallFeature;
  /** When true, renders as overlay on blurred content */
  overlay?: boolean;
  onDismiss?: () => void;
}

export default function LoginWall({ feature, overlay = true, onDismiss }: LoginWallProps) {
  const copy = COPY[feature];

  return (
    <div className={`login-wall ${overlay ? "login-wall-overlay" : ""}`} role="dialog" aria-modal="true">
      <div className="login-wall-card">
        <h2>{copy.title}</h2>
        <p>{copy.benefit}</p>
        <div className="login-wall-actions">
          <SignInButton mode="modal">
            <button type="button" className="btn btn-primary">
              {copy.cta}
            </button>
          </SignInButton>
          <Link href="/pricing" className="btn btn-secondary">
            View pricing
          </Link>
          {onDismiss && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={onDismiss}>
              Not now
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
