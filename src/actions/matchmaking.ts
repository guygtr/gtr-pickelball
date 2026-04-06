"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { Attendance, Match, Player } from "@prisma/client";

interface MatchData {
  status: "UPCOMING" | "LIVE" | "COMPLETED";
  team1: string[];
  team2: string[];
  score1: number;
  score2: number;
  type: "SINGLES" | "DOUBLES";
}

export async function generateMatches(sessionId: string) {
  // 1. Récupérer la session et la ligue
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: {
      league: {
        include: {
          courts: true,
        }
      },
      attendances: {
        where: { isPresent: true },
        include: { player: true }
      },
      matches: true
    }
  });

  if (!session) throw new Error("Session non trouvée");

  // On nettoie les anciens matchs UPCOMING avant de régénérer
  const upcomingMatchIds = (session.matches as Match[])
    .filter((m) => {
       const d = m.data as unknown as MatchData;
       return d?.status === "UPCOMING";
    })
    .map((m) => m.id);

  if (upcomingMatchIds.length > 0) {
    await prisma.match.deleteMany({
      where: { id: { in: upcomingMatchIds } }
    });
  }

  const presentPlayers = (session.attendances as (Attendance & { player: Player })[]).map((a) => a.player);
  if (presentPlayers.length < 2) throw new Error("Pas assez de joueurs présents");

  const courts = session.league.courts;
  if (courts.length === 0) throw new Error("Aucun terrain configuré pour cette ligue");

  // Paramètres de génération
  const matchDuration = 15; // min
  const sessionDuration = session.duration || 120; // 2h par défaut
  const roundsCount = Math.max(1, Math.floor(sessionDuration / matchDuration));
  
  const matchesToCreate = [];
  
  // Suivi global pour l'équilibrage
  const playCount = new Map<string, number>(presentPlayers.map(p => [p.id, 0]));
  // Suivi des partenariats : clé = sort(id1, id2).join(',')
  const partnershipCount = new Map<string, number>();

  function getPartnershipKey(id1: string, id2: string) {
    return [id1, id2].sort().join(',');
  }

  for (let round = 0; round < roundsCount; round++) {
    // Joueurs encore disponibles pour ce round spécifique
    const availableInRound = [...presentPlayers].sort((a, b) => 
      (playCount.get(a.id) || 0) - (playCount.get(b.id) || 0) || Math.random() - 0.5
    );

    for (let i = 0; i < courts.length && availableInRound.length >= 2; i++) {
        // 1. Choisir le joueur qui a le moins joué au global
        const p1 = availableInRound.shift()!;
        
        const team1: string[] = [p1.id];
        let team2: string[] = [];

        // 2. Décider si on fait du Double ou du Simple
        // Si on a assez de monde pour faire du double sur ce terrain (4+)
        // OU si c'est le seul moyen de faire jouer tout le monde
        const canDoDoubles = availableInRound.length >= 3; // p1 + 3 autres = 4

        if (canDoDoubles) {
            // Trouver le meilleur partenaire pour p1 parmi les restants
            // Critère : celui avec qui il a le moins fait équipe
            availableInRound.sort((a, b) => {
                const countA = partnershipCount.get(getPartnershipKey(p1.id, a.id)) || 0;
                const countB = partnershipCount.get(getPartnershipKey(p1.id, b.id)) || 0;
                return countA - countB || (playCount.get(a.id) || 0) - (playCount.get(b.id) || 0) || Math.random() - 0.5;
            });
            const p2 = availableInRound.shift()!;
            team1.push(p2.id);
            
            // Enregistrer le partenariat
            const key = getPartnershipKey(p1.id, p2.id);
            partnershipCount.set(key, (partnershipCount.get(key) || 0) + 1);

            // Equipe 2 (les 2 suivants qui ont le moins joué)
            // On pourrait aussi optimiser leur partenariat ici
            const p3 = availableInRound.shift()!;
            const p4 = availableInRound.shift()!;
            team2 = [p3.id, p4.id];
            
            const key2 = getPartnershipKey(p3.id, p4.id);
            partnershipCount.set(key2, (partnershipCount.get(key2) || 0) + 1);
        } else {
            // Simple (p1 vs p2)
            const p2 = availableInRound.shift()!;
            team2 = [p2.id];
        }

        // Mettre à jour le playCount global
        [...team1, ...team2].forEach(id => playCount.set(id, (playCount.get(id) || 0) + 1));

        matchesToCreate.push({
            sessionId,
            courtId: courts[i].id,
            data: {
                team1,
                team2,
                score1: 0,
                score2: 0,
                status: "UPCOMING",
                type: team1.length === 2 ? "DOUBLES" : "SINGLES"
            }
        });
    }
  }

  // Enregistrer tous les rounds
  if (matchesToCreate.length > 0) {
    await prisma.match.createMany({
      data: matchesToCreate
    });
  }

  revalidatePath(`/leagues/${session.leagueId}/sessions/${sessionId}`);
}

export async function toggleAttendance(sessionId: string, playerId: string, isPresent: boolean) {
    await prisma.attendance.upsert({
        where: {
            sessionId_playerId: { sessionId, playerId }
        },
        update: { isPresent },
        create: { sessionId, playerId, isPresent }
    });
    
    const session = await prisma.session.findUnique({ where: { id: sessionId } });
    if (session) {
        revalidatePath(`/leagues/${session.leagueId}/sessions/${sessionId}`);
    }
}

export async function deleteMatch(matchId: string) {
    const match = await prisma.match.findUnique({
        where: { id: matchId },
        include: { session: true }
    });
    
    if (!match) throw new Error("Match non trouvé");
    
    await prisma.match.delete({
        where: { id: matchId }
    });
    
    revalidatePath(`/leagues/${match.session.leagueId}/sessions/${match.sessionId}`);
}

export async function deleteAllMatches(sessionId: string) {
    const session = await prisma.session.findUnique({
        where: { id: sessionId }
    });
    
    if (!session) throw new Error("Session non trouvée");
    
    await prisma.match.deleteMany({
        where: { sessionId }
    });
    
    revalidatePath(`/leagues/${session.leagueId}/sessions/${sessionId}`);
}
