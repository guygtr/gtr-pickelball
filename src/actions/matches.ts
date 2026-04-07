"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { Attendance, Match, Player, Prisma } from "@prisma/client";
import { ensureSessionManager, ensureMatchManager, ensureLeagueManager } from "@/lib/auth-utils";

interface MatchData {
  status: "UPCOMING" | "LIVE" | "COMPLETED";
  team1: string[];
  team2: string[];
  score1: number;
  score2: number;
  type: "SINGLES" | "DOUBLES";
}

export async function generateMatches(sessionId: string) {
  await ensureSessionManager(sessionId);
  
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
  
  const matchesToCreate: Prisma.MatchCreateManyInput[] = [];
  
  // 3. Hydratation de l'historique
  const playCount = new Map<string, number>(presentPlayers.map(p => [p.id, 0]));
  const partnershipCount = new Map<string, number>();
  const oppositionCount = new Map<string, number>();

  function getPartnershipKey(id1: string, id2: string) {
    return [id1, id2].sort().join(',');
  }

  session.matches.forEach(m => {
    const d = m.data as unknown as MatchData;
    if (!d) return;

    [...d.team1, ...d.team2].forEach(id => {
      if (playCount.has(id)) {
        playCount.set(id, (playCount.get(id) || 0) + 1);
      }
    });

    if (d.team1.length === 2 && playCount.has(d.team1[0]) && playCount.has(d.team1[1])) {
      const key = getPartnershipKey(d.team1[0], d.team1[1]);
      partnershipCount.set(key, (partnershipCount.get(key) || 0) + 1);
    }
    if (d.team2.length === 2 && playCount.has(d.team2[0]) && playCount.has(d.team2[1])) {
      const key = getPartnershipKey(d.team2[0], d.team2[1]);
      partnershipCount.set(key, (partnershipCount.get(key) || 0) + 1);
    }

    // Suivi des oppositions
    d.team1.forEach(t1Id => {
        d.team2.forEach(t2Id => {
            if (playCount.has(t1Id) && playCount.has(t2Id)) {
                const key = getPartnershipKey(t1Id, t2Id);
                oppositionCount.set(key, (oppositionCount.get(key) || 0) + 1);
            }
        });
    });
  });

  for (let round = 0; round < roundsCount; round++) {
    // 1. Sélectionner les joueurs pour ce round (ceux qui ont le moins joué au global)
    const sortedCandidates = [...presentPlayers].sort((a, b) => 
      (playCount.get(a.id) || 0) - (playCount.get(b.id) || 0) || Math.random() - 0.5
    );

    const totalPlaces = courts.length * 4;
    const playersInRound = sortedCandidates.slice(0, Math.min(sortedCandidates.length, totalPlaces));
    
    // Si on n'a pas au moins 2 joueurs, on arrête
    if (playersInRound.length < 2) break;

    // --- OPTIMISATION GLOBALE MONTE CARLO (v3) ---
    // On teste 10 000 configurations pour trouver l'optimum global (partenariats + oppositions)
    let bestRoundMatches: { team1: Player[], team2: Player[], courtId: string }[] = [];
    let minRoundCost = Infinity;

    const ITERATIONS = 10000;
    for (let i = 0; i < ITERATIONS; i++) {
        const shuffled = [...playersInRound].sort(() => Math.random() - 0.5);
        let currentCost = 0;
        const matches: { team1: Player[], team2: Player[], courtId: string }[] = [];
        const tempPlayers = [...shuffled];

        for (let c = 0; c < courts.length && tempPlayers.length >= 2; c++) {
            const isDoubles = tempPlayers.length >= 4;
            const courtPlayers = isDoubles ? tempPlayers.splice(0, 4) : tempPlayers.splice(0, 2);
            
            const t1 = isDoubles ? [courtPlayers[0], courtPlayers[1]] : [courtPlayers[0]];
            const t2 = isDoubles ? [courtPlayers[2], courtPlayers[3]] : [courtPlayers[1]];

            // Calcul du coût du match
            if (isDoubles) {
                // Coût Partenariats (Poids 1000)
                const p1 = partnershipCount.get(getPartnershipKey(t1[0].id, t1[1].id)) || 0;
                const p2 = partnershipCount.get(getPartnershipKey(t2[0].id, t2[1].id)) || 0;
                // Coût Oppositions (Poids 1)
                const o1 = oppositionCount.get(getPartnershipKey(t1[0].id, t2[0].id)) || 0;
                const o2 = oppositionCount.get(getPartnershipKey(t1[0].id, t2[1].id)) || 0;
                const o3 = oppositionCount.get(getPartnershipKey(t1[1].id, t2[0].id)) || 0;
                const o4 = oppositionCount.get(getPartnershipKey(t1[1].id, t2[1].id)) || 0;
                currentCost += (p1 + p2) * 1000 + (o1 + o2 + o3 + o4);
            } else {
                // Simple : Opposition uniquement
                const o = oppositionCount.get(getPartnershipKey(t1[0].id, t2[0].id)) || 0;
                currentCost += o;
            }

            matches.push({ team1: t1, team2: t2, courtId: courts[c].id });
        }

        if (currentCost < minRoundCost) {
            minRoundCost = currentCost;
            bestRoundMatches = matches;
            if (minRoundCost === 0) break; // Perfection globale trouvée
        }
    }

    // Appliquer le meilleur round trouvé et mettre à jour les statistiques
    bestRoundMatches.forEach(m => {
        const team1 = m.team1.map(p => p.id);
        const team2 = m.team2.map(p => p.id);

        matchesToCreate.push({
            sessionId,
            courtId: m.courtId,
            data: {
                team1,
                team2,
                score1: 0,
                score2: 0,
                status: "UPCOMING",
                type: team1.length === 2 ? "DOUBLES" : "SINGLES"
            }
        });

        // 1. Mettre à jour le playCount global
        [...team1, ...team2].forEach(id => playCount.set(id, (playCount.get(id) || 0) + 1));

        // 2. Mettre à jour les partenariats
        if (team1.length === 2) {
            const k1 = getPartnershipKey(team1[0], team1[1]);
            const k2 = getPartnershipKey(team2[0], team2[1]);
            partnershipCount.set(k1, (partnershipCount.get(k1) || 0) + 1);
            partnershipCount.set(k2, (partnershipCount.get(k2) || 0) + 1);
        }

        // 3. Mettre à jour les oppositions
        m.team1.forEach(p1 => {
            m.team2.forEach(p2 => {
                const key = getPartnershipKey(p1.id, p2.id);
                oppositionCount.set(key, (oppositionCount.get(key) || 0) + 1);
            });
        });
    });
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
    await ensureSessionManager(sessionId);
    
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
    await ensureMatchManager(matchId);
    
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
    await ensureSessionManager(sessionId);
    
    const session = await prisma.session.findUnique({
        where: { id: sessionId }
    });
    
    if (!session) throw new Error("Session non trouvée");
    
    await prisma.match.deleteMany({
        where: { sessionId }
    });
    
    revalidatePath(`/leagues/${session.leagueId}/sessions/${sessionId}`);
}

export async function toggleRoundStatus(sessionId: string, roundIdx: number, isClosed: boolean) {
    await ensureSessionManager(sessionId);
    
    const session = await prisma.session.findUnique({
        where: { id: sessionId }
    });
    
    if (!session) throw new Error("Session non trouvée");
    
    const settings = (session.settings as { closedRounds?: number[] }) || {};
    let closedRounds = settings.closedRounds || [];
    
    if (isClosed) {
        if (!closedRounds.includes(roundIdx)) {
            closedRounds.push(roundIdx);
        }
    } else {
        closedRounds = closedRounds.filter(r => r !== roundIdx);
    }
    
    await prisma.session.update({
        where: { id: sessionId },
        data: {
            settings: {
                ...settings,
                closedRounds
            }
        }
    });
    
    revalidatePath(`/leagues/${session.leagueId}/sessions/${sessionId}`);
}

export async function updateMatchResult(matchId: string, winner: number) {
  try {
    // 1. Récupérer le match avec sa session pour valider les droits
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        session: {
          select: {
            leagueId: true,
            id: true
          }
        }
      }
    });

    if (!match) {
      return { success: false, error: "Match non trouvé" };
    }

    // 2. Sécurisation : Vérifier que l'utilisateur est le manager de la ligue
    await ensureLeagueManager(match.session.leagueId);

    // 3. Préparer les nouvelles données JSON
    const currentData = (match.data as { team1: string[]; team2: string[] }) || { team1: [], team2: [] }; 
    const newData = {
      ...currentData,
      winner: winner
    };

    // 4. Mise à jour de la base de données
    await prisma.match.update({
      where: { id: matchId },
      data: {
        data: newData
      }
    });

    revalidatePath(`/leagues/${match.session.leagueId}/sessions/${match.sessionId}`);
    
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Une erreur est survenue";
    console.error("Error updating match result:", error);
    return { success: false, error: errorMessage };
  }
}
