"use client";

import { useAuth } from "@clerk/nextjs";
import { useCallback, useEffect, useState } from "react";

export interface CreditUsage {
  plan: "free" | "pro";
  credits: {
    monthlyLimit: number | null;
    monthlyUsed: number;
    monthlyRemaining: number | null;
    packBalance: number;
    totalAvailable: number;
  };
}

export function useCreditUsage() {
  const { isSignedIn, isLoaded } = useAuth();
  const [usage, setUsage] = useState<CreditUsage | null>(null);
  const [stripeEnabled, setStripeEnabled] = useState(false);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!isLoaded || !isSignedIn) {
      setUsage(null);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/usage", { credentials: "same-origin" });
      if (!res.ok) {
        setUsage(null);
        return;
      }
      const data = await res.json();
      if (data?.credits && data?.plan) {
        setUsage({
          plan: data.plan,
          credits: data.credits,
        });
        setStripeEnabled(Boolean(data.billing?.stripeEnabled));
      }
    } catch {
      setUsage(null);
    } finally {
      setLoading(false);
    }
  }, [isLoaded, isSignedIn]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        refresh();
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [refresh]);

  return {
    usage,
    loading,
    isPro: usage?.plan === "pro",
    stripeEnabled,
    refresh,
  };
}
