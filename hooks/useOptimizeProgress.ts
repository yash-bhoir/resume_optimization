"use client";

import { useEffect, useState } from "react";

const OPTIMIZE_HINTS = [
  { afterMs: 0, text: "Analyzing your resume against the job description…" },
  { afterMs: 20_000, text: "Rewriting experience bullets with JD keywords…" },
  { afterMs: 50_000, text: "Long resumes can take 1–3 minutes — still working…" },
  { afterMs: 90_000, text: "Almost there — please keep this tab open…" },
];

export function useOptimizeProgress(active: boolean): string {
  const [hint, setHint] = useState(OPTIMIZE_HINTS[0].text);

  useEffect(() => {
    if (!active) {
      setHint(OPTIMIZE_HINTS[0].text);
      return;
    }

    const started = Date.now();
    setHint(OPTIMIZE_HINTS[0].text);

    const interval = setInterval(() => {
      const elapsed = Date.now() - started;
      let next = OPTIMIZE_HINTS[0].text;
      for (const entry of OPTIMIZE_HINTS) {
        if (elapsed >= entry.afterMs) next = entry.text;
      }
      setHint(next);
    }, 2000);

    return () => clearInterval(interval);
  }, [active]);

  return hint;
}
