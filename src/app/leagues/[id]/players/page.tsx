import { prisma } from "@/lib/prisma";
import { Users, Filter, Search } from "lucide-react";
import { PlayerListClient } from "@/components/players/player-list-client";
import { GlassCard } from "@/components/ui/gtr/glass-card";
import { PlayerActions } from "@/components/players/player-actions";
import { NeonButton } from "@/components/ui/gtr/neon-button";

export default async function PlayersPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const players = await prisma.player.findMany({
    where: { leagueId: resolvedParams.id },
    orderBy: { lastName: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-pickle-green" />
            Gestion des Joueurs
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            {players.length} joueurs inscrits dans cette ligue
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <PlayerListClient leagueId={resolvedParams.id} />
        </div>
      </div>

      <GlassCard className="overflow-hidden">
        <div className="p-4 border-b border-white/5 bg-white/5 flex flex-col sm:flex-row gap-4 justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input 
              placeholder="Rechercher un joueur..." 
              className="w-full bg-slate-900/50 border border-white/10 rounded-lg py-2 pl-10 pr-4 text-white text-sm focus:ring-2 focus:ring-pickle-green/50 outline-none transition-all"
            />
          </div>
          <NeonButton variant="blue" className="py-2 text-[10px]">
            <Filter className="w-4 h-4 flex-shrink-0" />
            FILTRER
          </NeonButton>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                <th className="px-6 py-4">Joueur</th>
                <th className="px-6 py-4">Niveau</th>
                <th className="px-6 py-4">Contact</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {players.map((player: { id: string; firstName: string; lastName: string; email: string | null; phone: string | null; skillLevel: number }) => (
                <tr key={player.id} className="group hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pickle-green to-pickle-blue flex items-center justify-center text-pickle-dark text-xs font-bold">
                        {player.firstName[0]}{player.lastName[0]}
                      </div>
                      <span className="text-white font-medium">{player.firstName} {player.lastName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 rounded-md bg-pickle-green/10 border border-pickle-green/20 text-pickle-green text-xs font-bold">
                      {player.skillLevel.toFixed(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-400 text-sm">
                    {player.email || player.phone || "-"}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <PlayerActions 
                      leagueId={resolvedParams.id} 
                      player={player}
                    />
                  </td>
                </tr>
              ))}
              {players.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                    Aucun joueur trouvé. Commencez par en ajouter un ou importez un fichier CSV.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}
