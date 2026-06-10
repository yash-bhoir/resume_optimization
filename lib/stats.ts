import { connectDB } from "@/lib/mongodb";
import { User } from "@/lib/models/User";
import { GlobalStats } from "@/lib/models/GlobalStats";

export interface PublicStats {
  totalOptimizations: number;
  jobSeekers: number;
  averageScoreImprovement: number;
}

export async function getPublicStats(): Promise<PublicStats> {
  try {
    await connectDB();

    const [globalDoc, userCount, monthlyFallback] = await Promise.all([
      GlobalStats.findOne({ key: "global" }).lean<{
        totalOptimizationsLifetime: number;
        totalKeywordGainSum: number;
      }>(),
      User.countDocuments({ optimizationsThisMonth: { $gt: 0 } }),
      User.aggregate<{ total: number }>([
        { $group: { _id: null, total: { $sum: "$optimizationsThisMonth" } } },
      ]),
    ]);

    const lifetime = globalDoc?.totalOptimizationsLifetime ?? 0;
    const monthlyTotal = monthlyFallback[0]?.total ?? 0;
    const totalOptimizations = lifetime > 0 ? lifetime : monthlyTotal;

    const gainSum = globalDoc?.totalKeywordGainSum ?? 0;
    const averageScoreImprovement =
      lifetime > 0 ? Math.round((gainSum / lifetime) * 10) / 10 : 0;

    const jobSeekers = Math.max(userCount, totalOptimizations > 0 ? 1 : 0);

    return {
      totalOptimizations,
      jobSeekers,
      averageScoreImprovement,
    };
  } catch {
    return { totalOptimizations: 0, jobSeekers: 0, averageScoreImprovement: 0 };
  }
}

/** @deprecated Use getPublicStats */
export async function getTotalOptimizationsCount(): Promise<number> {
  const stats = await getPublicStats();
  return stats.totalOptimizations;
}
