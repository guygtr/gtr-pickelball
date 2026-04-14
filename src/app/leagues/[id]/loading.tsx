import { Skeleton } from "@/components/ui/Skeleton";
import { GlassCard } from "@/components/ui/gtr/glass-card";

export default function LeagueDetailLoading() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Stats Skeletons */}
      {[1, 2, 3, 4].map((i) => (
        <GlassCard key={i} className="p-8 relative overflow-hidden">
          <div className="flex flex-col gap-4">
            <Skeleton className="h-3 w-20" />
            <div className="flex items-end justify-between">
              <Skeleton className="h-10 w-16" />
              <Skeleton className="w-6 h-6 rounded-full" />
            </div>
          </div>
        </GlassCard>
      ))}

      {/* Players List Skeleton */}
      <GlassCard className="md:col-span-2 p-8">
        <div className="flex items-center justify-between mb-10">
          <div className="space-y-3">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-8 w-20 rounded-xl" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
              <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
              <Skeleton className="h-6 w-10 rounded-full" />
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Sessions Skeleton */}
      <GlassCard className="md:col-span-2 p-8">
        <div className="flex items-center justify-between mb-10">
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
              <div className="flex items-center gap-4">
                <Skeleton className="w-12 h-12 rounded-xl" />
                <div className="space-y-2">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 w-4" />
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
