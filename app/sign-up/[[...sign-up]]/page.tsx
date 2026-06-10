import { SignUp } from "@clerk/nextjs";
import SignupAnalytics from "@/components/SignupAnalytics";

export default function SignUpPage() {
  return (
    <div className="auth-page">
      <SignupAnalytics />
      <SignUp fallbackRedirectUrl="/" signInUrl="/sign-in" />
    </div>
  );
}
