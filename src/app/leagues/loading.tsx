import { Skeleton } from "@/components/ui/Skeleton";
import { GlassCard } from "@/components/ui/gtr/glass-card";

export default function LeaguesLoading() {
  return (
    <main className="min-h-screen pt-24 pb-20 px-4">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header Skeleton */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-12">
          <div className="space-y-4">
            <Skeleton className="h-16 w-64 md:h-20" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-14 w-48 rounded-xl" />
        </div>

        {/* Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <GlassCard key={i} className="p-8 h-80 flex flex-col space-y-6">
              <div className="flex justify-between items-start">
                <Skeleton className="w-14 h-14 rounded-2xl" />
                <div className="space-y-2 flex flex-col items-end">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-6 w-12" />
                </div>
              </div>
              <Skeleton className="h-8 w-3/4" />
              <div className="space-y-2 flex-grow">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
              </div>
              <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-5 w-5" />
              </div>
            </GlassCard>
          ))}
        </div>
      </div>
    </main>
  );
}
