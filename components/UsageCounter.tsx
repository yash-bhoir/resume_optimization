"use client";

import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { useCreditUsage } from "@/hooks/useCreditUsage";
import ManageBillingButton from "@/components/ManageBillingButton";

interface UsageCounterProps {
  compact?: boolean;
}

export default function UsageCounter({ compact = false }: UsageCounterProps) {
  const { isSignedIn, isLoaded } = useAuth();
  const { usage, stripeEnabled } = useCreditUsage();

  if (!isLoaded || !isSignedIn || !usage) return null;

  const { credits, plan } = usage;

  if (plan === "pro") {
    if (compact) {
      return (
        <span className="header-plan-badge header-plan-badge-pro" role="status">
          Pro
        </span>
      );
    }
    return (
      <div className="usage-counter usage-counter-pro" role="status">
        <span>Pro plan · {credits.monthlyUsed} optimizations this month</span>
        <ManageBillingButton stripeEnabled={stripeEnabled} />
      </div>
    );
  }

  if (compact) {
    return (
      <span className="header-plan-badge" role="status">
        {credits.totalAvailable} credit{credits.totalAvailable === 1 ? "" : "s"}
      </span>
    );
  }

  return (
    <div className="usage-counter" role="status">
      <span>
        {credits.totalAvailable} credit{credits.totalAvailable === 1 ? "" : "s"} left
        {credits.packBalance > 0 ? ` (${credits.packBalance} from packs)` : ""}
      </span>
      {credits.totalAvailable === 0 && (
        <Link href="/pricing" className="usage-counter-link">
          Get more credits
        </Link>
      )}
    </div>
  );
}
