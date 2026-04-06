"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

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
      }
    }
  });

  if (!session) throw new Error("Session non trouvée");

  const presentPlayers = session.attendances.map(a => a.player);
  if (presentPlayers.length < 2) throw new Error("Pas assez de joueurs présents");

  // 2. Vérifier les terrains (Créer un terrain par défaut si absent)
  let courts = session.league.courts;
  if (courts.length === 0) {
    const defaultCourt = await prisma.court.create({
      data: {
        name: "Terrain Principal",
        leagueId: session.leagueId,
      }
    });
    courts = [defaultCourt];
  }

  // 3. Algorithme de Matchmaking Aléatoire simple
  const shuffled = [...presentPlayers].sort(() => Math.random() - 0.5);
  const matchesToCreate = [];
  
  // On remplit les terrains disponibles par groupe de 4 (Double)
  let playerIdx = 0;
  for (let i = 0; i < courts.length && playerIdx + 3 < shuffled.length; i++) {
    const team1 = [shuffled[playerIdx].id, shuffled[playerIdx + 1].id];
    const team2 = [shuffled[playerIdx + 2].id, shuffled[playerIdx + 3].id];
    
    matchesToCreate.push({
      sessionId,
      courtId: courts[i].id,
      data: {
        team1,
        team2,
        score1: 0,
        score2: 0,
        status: "UPCOMING"
      }
    });
    playerIdx += 4;
  }

  // Si moins de 4 joueurs mais au moins 2, on peut faire un Simple sur le premier terrain si vide
  if (matchesToCreate.length === 0 && presentPlayers.length >= 2) {
      matchesToCreate.push({
          sessionId,
          courtId: courts[0].id,
          data: {
              team1: [shuffled[0].id],
              team2: [shuffled[1].id],
              score1: 0,
              score2: 0,
              status: "UPCOMING"
          }
      });
  }

  // 4. Enregistrer les matchs
  if (matchesToCreate.length > 0) {
    // Supprimer les anciens matchs UPCOMING pour cette session si on relance ?
    // Pour l'instant on ajoute simplement.
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
