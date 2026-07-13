import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Trophy } from "lucide-react";
import { calculateLeagueRankings } from "@/lib/domain/stats";
import { Leaderboard } from "@/components/leagues/leaderboard";

export default async function HallOfFamePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;

  const league = await prisma.league.findUnique({
    where: { id: resolvedParams.id },
    include: {
      players: true,
    },
  });

  if (!league) {
    notFound();
  }

  const matches = await prisma.match.findMany({
    where: {
      session: {
        leagueId: league.id,
      },
    },
    select: {
      data: true,
    },
  });

  const rankings = calculateLeagueRankings(league.players, matches);

  return (
    <div className="space-y-6">
      <div className="border-b border-white/5 pb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
            <Trophy className="w-5 h-5 text-pickle-muted" />
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-semibold text-white tracking-tight">
              Hall of Fame
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Classement par taux de victoire — égalité départagée par les wins.
            </p>
          </div>
        </div>
      </div>

      {rankings.length === 0 ? (
        <div className="text-center py-16 text-slate-500 text-sm">
          Aucun match terminé pour l&apos;instant.
        </div>
      ) : (
        <Leaderboard rankings={rankings} />
      )}
    </div>
  );
}
