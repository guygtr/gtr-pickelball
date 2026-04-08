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
  
  // 1. Charger les données de la ligue et des joueurs
  const league = await prisma.league.findUnique({
    where: { id: resolvedParams.id },
    include: {
      players: true,
    },
  });

  if (!league) {
    notFound();
  }

  // 2. Récupérer tous les matchs terminés de la ligue
  const matches = await prisma.match.findMany({
    where: {
      session: {
        leagueId: league.id
      }
    },
    select: {
      data: true
    }
  });

  // 3. Calculer le classement
  const rankings = calculateLeagueRankings(league.players, matches);

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-2xl bg-pickle-orange/10 border border-pickle-orange/20">
          <Trophy className="w-8 h-8 text-pickle-orange" />
        </div>
        <div>
          <h2 className="text-3xl font-black text-white tracking-tighter uppercase leading-none">
            Hall of <span className="text-pickle-orange">Fame</span>
          </h2>
          <p className="text-[10px] font-bold text-slate-500 tracking-[0.3em] uppercase mt-1">Élite de la ligue — Classement Officiel</p>
        </div>
      </div>

      <Leaderboard rankings={rankings} />
      
      <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/5 text-center">
        <p className="text-slate-500 text-xs italic">
          Le classement est basé sur le taux de victoire (Win Rate). En cas d'égalité, le nombre de victoires totales prévaut.
        </p>
      </div>
    </div>
  );
}
