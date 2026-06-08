"use client";

import Link from "next/link";

interface AppHeaderProps {
  showBack?: boolean;
  backHref?: string;
  backLabel?: string;
}

export default function AppHeader({
  showBack = false,
  backHref = "/",
  backLabel = "New optimization",
}: AppHeaderProps) {
  return (
    <header className="app-header">
      <div className="app-header-inner">
        <Link href="/" className="brand">
          <span className="brand-icon" aria-hidden>
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <rect width="28" height="28" rx="8" fill="url(#brandGrad)" />
              <path
                d="M8 18V10h3.2c2 0 3.3 1 3.3 2.6 0 1.1-.6 2-1.6 2.4L15.5 18H12l-1.8-2.5H11V18H8zm3-4.5h.8c.9 0 1.4-.4 1.4-1.1s-.5-1.1-1.4-1.1H11v2.2zM16.5 18V10H20v2.2h-2.2V13H19.5v2.2h-1.7V18h-1.3z"
                fill="white"
              />
              <defs>
                <linearGradient id="brandGrad" x1="0" y1="0" x2="28" y2="28">
                  <stop stopColor="#4F46E5" />
                  <stop offset="1" stopColor="#0EA5E9" />
                </linearGradient>
              </defs>
            </svg>
          </span>
          <span className="brand-text">
            <span className="brand-name">Resume Optimizer</span>
            <span className="brand-tagline">ATS-ready · JD-tailored</span>
          </span>
        </Link>

        <nav className="header-nav">
          {showBack ? (
            <Link href={backHref} className="header-link">
              ← {backLabel}
            </Link>
          ) : (
            <span className="header-pill">Free · No login</span>
          )}
        </nav>
      </div>
    </header>
  );
}
