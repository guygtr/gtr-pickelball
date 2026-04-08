import { Player } from "@prisma/client";
import { MatchDataSchema } from "@/lib/session-utils";

export interface PlayerRank {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  wins: number;
  losses: number;
  matchesPlayed: number;
  winRate: number;
}

/**
 * Calcule les statistiques de classement pour une ligue.
 */
export function calculateLeagueRankings(
  players: Player[], 
  matches: { data: any }[]
): PlayerRank[] {
  const statsMap = new Map<string, { wins: number; losses: number; matchesPlayed: number }>();

  // Initialiser la map pour tous les joueurs
  players.forEach(p => {
    statsMap.set(p.id, { wins: 0, losses: 0, matchesPlayed: 0 });
  });

  // Parcourir les matchs terminés
  matches.forEach(m => {
    const data = m.data as any; // Cast à cause de Prisma Json
    if (!data || data.winner === undefined || data.winner === null) return;

    const team1 = data.team1 as string[] || [];
    const team2 = data.team2 as string[] || [];
    const winner = data.winner; // 0 pour team1, 1 pour team2

    // Équipe 1
    team1.forEach(id => {
      if (!statsMap.has(id)) return;
      const s = statsMap.get(id)!;
      s.matchesPlayed++;
      if (winner === 0) s.wins++;
      else s.losses++;
    });

    // Équipe 2
    team2.forEach(id => {
      if (!statsMap.has(id)) return;
      const s = statsMap.get(id)!;
      s.matchesPlayed++;
      if (winner === 1) s.wins++;
      else s.losses++;
    });
  });

  // Transformer en tableau et calculer le winRate
  const rankings: PlayerRank[] = players.map(p => {
    const s = statsMap.get(p.id)!;
    const winRate = s.matchesPlayed > 0 ? (s.wins / s.matchesPlayed) * 100 : 0;
    
    return {
      id: p.id,
      name: `${p.firstName} ${p.lastName}`,
      firstName: p.firstName,
      lastName: p.lastName,
      wins: s.wins,
      losses: s.losses,
      matchesPlayed: s.matchesPlayed,
      winRate
    };
  });

  // Trier : WinRate DESC, Victoires DESC, Matchs Joués DESC
  return rankings.sort((a, b) => {
    if (b.winRate !== a.winRate) return b.winRate - a.winRate;
    if (b.wins !== a.wins) return b.wins - a.wins;
    return b.matchesPlayed - a.matchesPlayed;
  });
}
