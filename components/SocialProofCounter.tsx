import { getPublicStats } from "@/lib/stats";

export default async function SocialProofCounter() {
  const { totalOptimizations, jobSeekers, averageScoreImprovement } = await getPublicStats();

  if (totalOptimizations <= 0) {
    return (
      <p className="social-proof-line" role="status">
        Be among the first job seekers to optimize your resume with our free{" "}
        <strong>ATS resume checker</strong>
      </p>
    );
  }

  return (
    <p className="social-proof-line" role="status">
      Join <strong>{jobSeekers.toLocaleString()}</strong> job seekers who optimized{" "}
      <strong>{totalOptimizations.toLocaleString()}</strong> resumes
      {averageScoreImprovement > 0 && (
        <>
          {" "}
          — average keyword match improves <strong>+{averageScoreImprovement}%</strong>
        </>
      )}{" "}
      with our <strong>ATS resume checker</strong>
    </p>
  );
}
