"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AppHeader from "@/components/AppHeader";
import Footer from "@/components/Footer";
import LoadingOverlay from "@/components/LoadingOverlay";

interface VerifyResult {
  verified: boolean;
  product?: string;
  plan?: string;
  credits?: { totalAvailable: number; packBalance: number };
}

export default function PricingSuccessPage() {
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    let attempts = 0;

    const sessionId =
      typeof window !== "undefined"
        ? new URLSearchParams(window.location.search).get("session_id")
        : null;

    const verify = async () => {
      const url = sessionId
        ? `/api/stripe/verify?session_id=${encodeURIComponent(sessionId)}`
        : "/api/usage";

      const res = await fetch(url, { credentials: "same-origin" });
      if (!res.ok || cancelled) return null;
      return res.json();
    };

    const poll = async () => {
      const data = await verify();
      if (cancelled || !data) {
        if (!cancelled) setLoading(false);
        return;
      }

      if (sessionId) {
        setResult({
          verified: data.verified,
          product: data.product,
          plan: data.plan,
          credits: data.credits,
        });
        if (!data.verified && attempts < 8) {
          attempts += 1;
          setTimeout(poll, 1500);
          return;
        }
        setLoading(false);
        return;
      }

      setResult({ verified: true, plan: data.plan, credits: data.credits });
      setLoading(false);
    };

    void poll();

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="app-shell">
        <AppHeader />
        <LoadingOverlay title="Confirming payment" subtitle="Activating your plan or credits" />
      </div>
    );
  }

  const isPro = result?.plan === "pro" || result?.product === "pro";
  const isPack = result?.product === "credit_pack";

  return (
    <div className="app-shell">
      <AppHeader />
      <main className="app-main marketing-page">
        <h1>Payment successful</h1>
        <p className="marketing-lead">
          {isPro
            ? "You're on Pro — preserve layout, higher monthly credits, and full ATS reports are unlocked."
            : isPack
              ? `Your credit pack is active. You now have ${result?.credits?.totalAvailable ?? ""} credits available.`
              : "Your payment was received. Credits or Pro access will appear shortly."}
        </p>
        {!result?.verified && (
          <p className="payment-setup-notice" role="status">
            Webhook may still be processing. Refresh this page in a moment if credits don&apos;t
            appear.
          </p>
        )}
        <div className="pricing-success-actions">
          <Link href="/" className="btn btn-primary">
            Optimize a resume
          </Link>
          <Link href="/history" className="btn btn-secondary">
            View history
          </Link>
          {isPro && (
            <Link href="/pricing" className="btn btn-secondary">
              Manage plan
            </Link>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
