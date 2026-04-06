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
  
  // Suivi du nombre de matchs par joueur pour équilibrer
  const playCount = new Map<string, number>(presentPlayers.map(p => [p.id, 0]));

  for (let round = 0; round < roundsCount; round++) {
    // Trier les joueurs par temps de jeu (ceux qui ont le moins joué d'abord)
    const availablePlayers = [...presentPlayers].sort((a, b) => 
      (playCount.get(a.id) || 0) - (playCount.get(b.id) || 0) || Math.random() - 0.5
    );

    let playerIdx = 0;
    for (let i = 0; i < courts.length && playerIdx + 1 < availablePlayers.length; i++) {
        const playersLeft = availablePlayers.length - playerIdx;
        
        let team1: string[] = [];
        let team2: string[] = [];

        if (playersLeft >= 4) {
            team1 = [availablePlayers[playerIdx].id, availablePlayers[playerIdx + 1].id];
            team2 = [availablePlayers[playerIdx + 2].id, availablePlayers[playerIdx + 3].id];
            playerIdx += 4;
        } else if (playersLeft >= 2) {
            team1 = [availablePlayers[playerIdx].id];
            team2 = [availablePlayers[playerIdx + 1].id];
            playerIdx += 2;
        }

        if (team1.length > 0) {
            // Mettre à jour le playCount
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
