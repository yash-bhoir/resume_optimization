"use client";

import { useState } from "react";

interface ManageBillingButtonProps {
  stripeEnabled: boolean;
  className?: string;
  label?: string;
}

export default function ManageBillingButton({
  stripeEnabled,
  className = "btn btn-secondary btn-sm",
  label = "Manage billing",
}: ManageBillingButtonProps) {
  const [loading, setLoading] = useState(false);

  if (!stripeEnabled) return null;

  const handleClick = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", {
        method: "POST",
        credentials: "same-origin",
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <button type="button" className={className} onClick={handleClick} disabled={loading}>
      {loading ? "Opening…" : label}
    </button>
  );
}
