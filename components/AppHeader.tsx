"use client";

import Link from "next/link";
import { useAuth, SignInButton, UserButton } from "@clerk/nextjs";
import UsageCounter from "@/components/UsageCounter";

interface AppHeaderProps {
  showBack?: boolean;
  backHref?: string;
  backLabel?: string;
}

function BrandIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden>
      <rect width="32" height="32" rx="8" fill="var(--color-accent)" />
      <path
        d="M9 21V11h3.5c2.1 0 3.5 1.1 3.5 2.8 0 1.2-.7 2.1-1.8 2.5L17 21h-3.6l-2-2.8h1.9V21H9zm3.2-5h.9c.9 0 1.4-.4 1.4-1.2s-.5-1.2-1.4-1.2h-.9v2.4zM18 21V11h3.8v2.3H20.2v1.5h1.4v2.3h-1.4V21H18z"
        fill="white"
      />
    </svg>
  );
}

export default function AppHeader({
  showBack = false,
  backHref = "/",
  backLabel = "New optimization",
}: AppHeaderProps) {
  const { isSignedIn, isLoaded } = useAuth();

  return (
    <header className="app-header">
      <div className="app-header-inner">
        <Link href="/" className="brand" aria-label="Resume Optimizer home">
          <span className="brand-icon">
            <BrandIcon />
          </span>
          <span className="brand-text">
            <span className="brand-name">Resume Optimizer</span>
            <span className="brand-tagline">Tailor resumes to job postings</span>
          </span>
        </Link>

        <nav className="header-nav" aria-label="Main">
          <div className="header-nav-links">
            <Link href="/how-it-works" className="header-link header-link--aux">
              How it works
            </Link>
            <Link href="/pricing" className="header-link header-link--aux">
              Pricing
            </Link>
            <Link href="/faq" className="header-link header-link--aux">
              FAQ
            </Link>
            <Link href="/blog" className="header-link header-link--aux">
              Blog
            </Link>
            {isLoaded && isSignedIn && (
              <Link href="/history" className="header-link">
                History
              </Link>
            )}
            {showBack && (
              <Link href={backHref} className="header-link">
                ← {backLabel}
              </Link>
            )}
          </div>

          <div className="header-nav-auth">
            {!isSignedIn && (
              isLoaded ? (
                <SignInButton mode="modal">
                  <button type="button" className="btn btn-secondary btn-sm">
                    Sign in
                  </button>
                </SignInButton>
              ) : (
                <Link href="/sign-in" className="btn btn-secondary btn-sm">
                  Sign in
                </Link>
              )
            )}

            {isLoaded && isSignedIn && (
              <>
                <UsageCounter compact />
                <UserButton />
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
