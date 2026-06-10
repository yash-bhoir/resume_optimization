"use client";

import { useState } from "react";
import { useAuth, SignInButton } from "@clerk/nextjs";

interface PricingCheckoutProps {
  product: "pro" | "credit_pack";
  label: string;
  className?: string;
  stripeEnabled: boolean;
}

export default function PricingCheckout({
  product,
  label,
  className = "btn btn-primary",
  stripeEnabled,
}: PricingCheckoutProps) {
  const { isSignedIn, isLoaded } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Checkout failed");
      }
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      throw new Error("No checkout URL returned");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed");
    } finally {
      setLoading(false);
    }
  };

  if (!stripeEnabled) {
    return (
      <div className="pricing-checkout-wrap">
        <button
          type="button"
          className={className}
          disabled
          title="Add STRIPE_* keys to .env.local to enable checkout"
        >
          {label}
        </button>
        <p className="pricing-checkout-hint">Payments wired — add Stripe keys to go live</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <button type="button" className={className} disabled>
        Loading…
      </button>
    );
  }

  if (!isSignedIn) {
    return (
      <SignInButton mode="modal">
        <button type="button" className={className}>
          Sign in to {label.toLowerCase()}
        </button>
      </SignInButton>
    );
  }

  return (
    <div className="pricing-checkout-wrap">
      <button
        type="button"
        className={className}
        onClick={handleCheckout}
        disabled={loading}
      >
        {loading ? "Redirecting…" : label}
      </button>
      {error && (
        <p className="pricing-checkout-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
