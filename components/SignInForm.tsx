"use client";

import { SignIn } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";

export default function SignInForm() {
  const searchParams = useSearchParams();
  const rawRedirect = searchParams.get("redirect_url");
  const fallbackRedirectUrl =
    rawRedirect?.startsWith("/") && !rawRedirect.startsWith("//") ? rawRedirect : "/";

  return (
    <div className="auth-page">
      <SignIn
        routing="path"
        path="/sign-in"
        signUpUrl="/sign-up"
        fallbackRedirectUrl={fallbackRedirectUrl}
      />
    </div>
  );
}
