import Link from "next/link";

export default function AuthUnavailable() {
  return (
    <div className="auth-page">
      <h1>Sign-in unavailable</h1>
      <p>
        Authentication is not configured on this server yet. If you run this app, add{" "}
        <code>NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</code> and <code>CLERK_SECRET_KEY</code> to your
        environment and redeploy.
      </p>
      <Link href="/" className="btn btn-primary">
        Back to home
      </Link>
    </div>
  );
}
