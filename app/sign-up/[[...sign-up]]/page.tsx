import { Suspense } from "react";
import AuthUnavailable from "@/components/AuthUnavailable";
import SignUpForm from "@/components/SignUpForm";
import SignupAnalytics from "@/components/SignupAnalytics";
import { isClerkConfigured } from "@/lib/clerk-env";

export default function SignUpPage() {
  if (!isClerkConfigured()) {
    return <AuthUnavailable />;
  }

  return (
    <Suspense
      fallback={
        <div className="auth-page">
          <p>Loading sign up…</p>
        </div>
      }
    >
      <SignupAnalytics />
      <SignUpForm />
    </Suspense>
  );
}
