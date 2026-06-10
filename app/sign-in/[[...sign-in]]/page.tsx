import { SignIn } from "@clerk/nextjs";

type SignInPageProps = {
  searchParams: Promise<{ redirect_url?: string }>;
};

function safeRedirectPath(value: string | undefined): string {
  if (!value?.startsWith("/") || value.startsWith("//")) return "/";
  return value;
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const { redirect_url: redirectUrl } = await searchParams;

  return (
    <div className="auth-page">
      <SignIn
        fallbackRedirectUrl={safeRedirectPath(redirectUrl)}
        signUpUrl="/sign-up"
      />
    </div>
  );
}
