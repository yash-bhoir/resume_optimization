export type AnalyticsEvent =
  | "resume_uploaded"
  | "optimization_started"
  | "optimization_completed"
  | "pdf_downloaded"
  | "upgrade_clicked"
  | "signup_started";

export interface AnalyticsProperties {
  score_before?: number;
  score_after?: number;
  reason?: string;
  [key: string]: unknown;
}

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

/** Fire a GA4 custom event and optional server-side log. Never throws. */
export function trackEvent(
  name: AnalyticsEvent,
  properties?: AnalyticsProperties
): void {
  try {
    const gaId = process.env.NEXT_PUBLIC_GA_ID;
    if (typeof window !== "undefined" && window.gtag && gaId) {
      window.gtag("event", name, properties);
    }

    if (typeof window !== "undefined") {
      fetch("/api/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event: name, metadata: properties }),
        keepalive: true,
      }).catch(() => {});
    }
  } catch {
    // Analytics must never break the app
  }
}
