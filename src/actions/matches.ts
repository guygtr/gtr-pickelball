"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { Attendance, Player, Prisma } from "@prisma/client";
import { ensureSessionManager, ensureMatchManager, ensureLeagueManager } from "@/lib/auth-utils";
import { generateFullSessionMatches, getPartnershipKey, getMatchupKey, getQuartetKey, MatchmakingStats, MatchDesign, MatchmakingMode } from "@/lib/domain/matchmaking";

import { 
  matchIdSchema, 
  matchResultSchema, 
  sessionIdSchema, 
  toggleAttendanceSchema, 
  toggleRoundStatusSchema 
} from "@/lib/validations/match";

interface SessionWithIterations {
  iterations: number;
}

/**
 * Interface pour les données JSON d'un match.
 */
interface MatchData {
  status: "UPCOMING" | "LIVE" | "COMPLETED";
  team1: string[];
  team2: string[];
  score1: number;
  score2: number;
  type: "SINGLES" | "DOUBLES";
  winner?: number;
}

/**
 * Génère les matchs pour une session donnée en utilisant l'algorithme Monte-Carlo du domaine.
 * @param {string} rawSessionId Identifiant de la session.
 * @param {MatchmakingMode} mode Mode de génération (RANDOM ou COMPETITIVE).
 */
export async function generateMatches(rawSessionId: string, mode: MatchmakingMode = "RANDOM") {
  try {
    const sessionId = sessionIdSchema.parse(rawSessionId);
    await ensureSessionManager(sessionId);
    
    // 1. Récupérer la session et la ligue avec les données nécessaires
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

    if (!session) return { success: false, error: "Session non trouvée" };

    // 2. Nettoyage des matchs "UPCOMING" existants
    const upcomingMatchIds = session.matches
      .filter((m) => (m.data as unknown as MatchData)?.status === "UPCOMING")
      .map((m) => m.id);

    if (upcomingMatchIds.length > 0) {
      await prisma.match.deleteMany({
        where: { id: { in: upcomingMatchIds } }
      });
    }

    const presentPlayers = (session.attendances as (Attendance & { player: Player })[]).map((a) => a.player);
    if (presentPlayers.length < 2) return { success: false, error: "Pas assez de joueurs présents" };

    const courts = session.league.courts;
    if (courts.length === 0) return { success: false, error: "Aucun terrain configuré pour cette ligue" };

    // 3. Préparation des statistiques historiques pour l'équité
    const matchmakingStats: MatchmakingStats = {
      playCount: new Map<string, number>(presentPlayers.map(p => [p.id, 0])),
      partnershipCount: new Map<string, number>(),
      oppositionCount: new Map<string, number>(),
      matchupCount: new Map<string, number>(),
      quartetCount: new Map<string, number>(),
      lastMatchups: new Set<string>(),
      playerSkills: new Map<string, number>(presentPlayers.map(p => [p.id, p.skillLevel])),
      mode
    };

    // Hydratation des stats via les matchs passés de la session
    session.matches.forEach(m => {
      const d = m.data as unknown as MatchData;
      if (!d) return;

      const quartetIds = [...d.team1, ...d.team2];
      const qKey = getQuartetKey(quartetIds);
      matchmakingStats.quartetCount.set(qKey, (matchmakingStats.quartetCount.get(qKey) || 0) + 1);

      quartetIds.forEach(id => {
        if (matchmakingStats.playCount.has(id)) {
          matchmakingStats.playCount.set(id, (matchmakingStats.playCount.get(id) || 0) + 1);
        }
      });

      if (d.team1.length === 2 && matchmakingStats.playCount.has(d.team1[0]) && matchmakingStats.playCount.has(d.team1[1])) {
        const key = getPartnershipKey(d.team1[0], d.team1[1]);
        matchmakingStats.partnershipCount.set(key, (matchmakingStats.partnershipCount.get(key) || 0) + 1);
      }
      if (d.team2.length === 2 && matchmakingStats.playCount.has(d.team2[0]) && matchmakingStats.playCount.has(d.team2[1])) {
        const key = getPartnershipKey(d.team2[0], d.team2[1]);
        matchmakingStats.partnershipCount.set(key, (matchmakingStats.partnershipCount.get(key) || 0) + 1);
      }

      d.team1.forEach(t1Id => {
        d.team2.forEach(t2Id => {
          if (matchmakingStats.playCount.has(t1Id) && matchmakingStats.playCount.has(t2Id)) {
            const key = getPartnershipKey(t1Id, t2Id);
            matchmakingStats.oppositionCount.set(key, (matchmakingStats.oppositionCount.get(key) || 0) + 1);
          }
        });
      });

      // Hydratation MatchupCount
      const mKey = getMatchupKey(d.team1, d.team2);
      matchmakingStats.matchupCount.set(mKey, (matchmakingStats.matchupCount.get(mKey) || 0) + 1);
    });

    // 4. Appel à la couche Domaine pour le matchmaking
    const sessionWithIter = session as unknown as SessionWithIterations;
    const matchDesigns = generateFullSessionMatches(
      presentPlayers,
      courts,
      matchmakingStats,
      session.duration || 120,
      15, // Durée fixe par match (standard)
      sessionWithIter.iterations || 10000
    );

    // 5. Création massive des matchs en base
    if (matchDesigns.length > 0) {
      const matchesToCreate: Prisma.MatchCreateManyInput[] = matchDesigns.map(design => ({
        sessionId,
        courtId: design.courtId,
        data: {
          team1: design.team1,
          team2: design.team2,
          score1: 0,
          score2: 0,
          status: "UPCOMING",
          type: design.type
        } as Prisma.InputJsonValue
      }));

      await prisma.match.createMany({
        data: matchesToCreate
      });
    }

    revalidatePath(`/leagues/${session.leagueId}/sessions/${sessionId}`);
    return { success: true };
  } catch (error) {
    console.error("Error generating matches:", error);
    return { success: false, error: error instanceof Error ? error.message : "Erreur lors de la génération" };
  }
}

/**
 * Gère la présence d'un joueur.
 * @param {Object} raw Données de présence.
 */
export async function toggleAttendance(raw: { sessionId: string, playerId: string, isPresent: boolean }) {
  try {
    const { sessionId, playerId, isPresent } = toggleAttendanceSchema.parse(raw);
    await ensureSessionManager(sessionId);
    
    await prisma.attendance.upsert({
      where: {
        sessionId_playerId: { sessionId, playerId }
      },
      update: { isPresent },
      create: { sessionId, playerId, isPresent }
    });
    
    const session = await prisma.session.findUnique({ 
      where: { id: sessionId },
      select: { leagueId: true }
    });

    if (session) {
      revalidatePath(`/leagues/${session.leagueId}/sessions/${sessionId}`);
    }
    return { success: true };
  } catch (error) {
    console.error("Error toggling attendance:", error);
    return { success: false, error: "Erreur lors de la mise à jour de la présence" };
  }
}

/**
 * Supprime un match spécifique.
 */
export async function deleteMatch(rawMatchId: string) {
  try {
    const matchId = matchIdSchema.parse(rawMatchId);
    await ensureMatchManager(matchId);
    
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: { session: true }
    });
    
    if (!match) return { success: false, error: "Match non trouvé" };
    
    await prisma.match.delete({
      where: { id: matchId }
    });
    
    revalidatePath(`/leagues/${match.session.leagueId}/sessions/${match.sessionId}`);
    return { success: true };
  } catch (error) {
    console.error("Error deleting match:", error);
    return { success: false, error: "Erreur lors de la suppression du match" };
  }
}

/**
 * Purge tous les matchs d'une session.
 */
export async function deleteAllMatches(rawSessionId: string) {
  try {
    const sessionId = sessionIdSchema.parse(rawSessionId);
    await ensureSessionManager(sessionId);
    
    const session = await prisma.session.findUnique({
      where: { id: sessionId }
    });
    
    if (!session) return { success: false, error: "Session non trouvée" };
    
    await prisma.match.deleteMany({
      where: { sessionId }
    });
    
    revalidatePath(`/leagues/${session.leagueId}/sessions/${sessionId}`);
    return { success: true };
  } catch (error) {
    console.error("Error deleting all matches:", error);
    return { success: false, error: "Erreur lors de la suppression massive" };
  }
}

/**
 * Verrouille ou déverrouille un round (affichage UI).
 */
export async function toggleRoundStatus(raw: { sessionId: string, roundIdx: number, isClosed: boolean }) {
  try {
    const { sessionId, roundIdx, isClosed } = toggleRoundStatusSchema.parse(raw);
    await ensureSessionManager(sessionId);
    
    const session = await prisma.session.findUnique({
      where: { id: sessionId }
    });
    
    if (!session) return { success: false, error: "Session non trouvée" };
    
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
        } as Prisma.InputJsonValue
      }
    });
    
    revalidatePath(`/leagues/${session.leagueId}/sessions/${sessionId}`);
    return { success: true };
  } catch (error) {
    console.error("Error toggling round status:", error);
    return { success: false, error: "Erreur lors du verrouillage" };
  }
}

/**
 * Met à jour le résultat d'un match avec validation Zod.
 * @param {string} matchIdRaw ID du match.
 * @param {number} winnerRaw Index du gagnant.
 */
export async function updateMatchResult(matchIdRaw: string, winnerRaw: number) {
  try {
    const matchId = matchIdSchema.parse(matchIdRaw);
    const { winner } = matchResultSchema.parse({ winner: winnerRaw });

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        session: { select: { leagueId: true, id: true } }
      }
    });

    if (!match) return { success: false, error: "Match non trouvé" };

    await ensureLeagueManager(match.session.leagueId);

    const currentData = (match.data as unknown as MatchData) || { team1: [], team2: [] }; 
    const newData = {
      ...currentData,
      winner,
      status: "COMPLETED"
    };

    await prisma.match.update({
      where: { id: matchId },
      data: { data: newData as Prisma.InputJsonValue }
    });

    revalidatePath(`/leagues/${match.session.leagueId}/sessions/${match.sessionId}`);
    
    return { success: true };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
    console.error("Error updating match result:", errorMessage);
    return { success: false, error: errorMessage };
  }
}
