"use client";

import { SignUp } from "@clerk/nextjs";

export default function SignUpForm() {
  return (
    <div className="auth-page">
      <SignUp routing="path" path="/sign-up" signInUrl="/sign-in" fallbackRedirectUrl="/" />
    </div>
  );
}
