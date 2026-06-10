import { Suspense } from "react";
import AuthUnavailable from "@/components/AuthUnavailable";
import SignInForm from "@/components/SignInForm";
import { isClerkConfigured } from "@/lib/clerk-env";

export default function SignInPage() {
  if (!isClerkConfigured()) {
    return <AuthUnavailable />;
  }

  return (
    <Suspense
      fallback={
        <div className="auth-page">
          <p>Loading sign in…</p>
        </div>
      }
    >
      <SignInForm />
    </Suspense>
  );
}
