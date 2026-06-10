import Link from "next/link";

export default function NotFound() {
  return (
    <div className="error-page">
      <h1>Page not found</h1>
      <p>The page you&apos;re looking for doesn&apos;t exist or was moved.</p>
      <div className="error-page-actions">
        <Link href="/" className="btn btn-primary">
          Back to home
        </Link>
      </div>
    </div>
  );
}
