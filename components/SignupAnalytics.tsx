"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics";

export default function SignupAnalytics() {
  useEffect(() => {
    trackEvent("signup_started");
  }, []);
  return null;
}
