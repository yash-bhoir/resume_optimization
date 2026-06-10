"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  console.error("[GlobalError]", error);

  return (
    <html lang="en">
      <body>
        <div className="error-page">
          <h1>Unexpected error</h1>
          <p>
            The app hit a problem it couldn&apos;t recover from. Refresh the page or return home
            to start a new optimization.
          </p>
          <button type="button" className="btn btn-primary" onClick={() => reset()}>
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
