import { getPublicStats } from "@/lib/stats";

export default async function SocialProof() {
  const { totalOptimizations, jobSeekers } = await getPublicStats();

  return (
    <div className="social-proof-block" role="status">
      {totalOptimizations > 0 ? (
        <p className="social-proof-line">
          <strong>{totalOptimizations.toLocaleString()}</strong> resumes optimized by{" "}
          <strong>{jobSeekers.toLocaleString()}</strong> job seekers
        </p>
      ) : (
        <p className="social-proof-line">
          Join job seekers using our free <strong>ATS resume checker</strong>
        </p>
      )}
      <p className="social-proof-rating" aria-label="Rated 4.8 out of 5 stars">
        <span className="social-proof-stars" aria-hidden="true">
          ★★★★★
        </span>{" "}
        <strong>4.8/5</strong> from early users
      </p>
      <p className="social-proof-companies">
        Used by job seekers at Google, Amazon, Microsoft, and top startups
      </p>
    </div>
  );
}
