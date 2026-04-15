"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { ensureLeagueManager } from "@/lib/auth-utils";
import { computeSessionImpact } from "@/lib/domain/elo";
import { logError } from "@/lib/logger";
import { MatchData } from "@/lib/domain/match-types";

/**
 * Traite les résultats d'une session pour mettre à jour les niveaux IA des participants.
 * Cette fonction est appelée automatiquement lors de la clôture d'une session.
 */
export async function processSessionAiLevels(sessionId: string) {
  try {
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
            include: {
        matches: true
      }
    });

    if (!session || (session.status !== "COMPLETED" && session.status !== "Completed")) return { success: false, error: "Session non valide pour le calcul IA" };

    await ensureLeagueManager(session.leagueId);

    // Récupérer TOUS les joueurs de la ligue pour garantir les correspondances (même si l'attendance est imprécise)
    const players = await prisma.player.findMany({
      where: { leagueId: session.leagueId }
    });

    // Filtrage robuste : seuls les matchs terminés avec un vainqueur et des équipes valides
    const matches = session.matches
      .map(m => m.data as unknown as MatchData)
      .filter((m) => {
        const isValid = m && 
          (m.status === "COMPLETED" || m.status === "Completed") && 
          m.winner !== undefined && 
          m.winner !== null &&
          Array.isArray(m.team1) && 
          Array.isArray(m.team2);
        
        return isValid;
      });

    const updates = players.map(async (player) => {
      // 1. Trouver tous les matchs du joueur dans cette session
      const playerMatches = matches.filter(m => 
        m.team1.includes(player.id) || m.team2.includes(player.id)
      ).map(m => {
        const isTeam1 = m.team1.includes(player.id);
        // Robustesse : conversion en nombre pour comparaison
        const winner = Number(m.winner);
        const won = (isTeam1 && winner === 1) || (!isTeam1 && winner === 2);
        
        // Calculer les niveaux moyens des équipes
        const teamIds = isTeam1 ? m.team1 : m.team2;
        const opponentIds = isTeam1 ? m.team2 : m.team1;

        // On utilise le niveau IA actuel (ou manuel si nul) pour le calcul de l'adversité
        const getEffectiveLevel = (pid: string) => {
          const p = players.find(lp => lp.id === pid);
          return p?.aiLevel ?? p?.skillLevel ?? 3.0;
        };

        const teamAvg = teamIds.reduce((acc: number, id: string) => acc + getEffectiveLevel(id), 0) / teamIds.length;
        const opponentAvg = opponentIds.reduce((acc: number, id: string) => acc + getEffectiveLevel(id), 0) / opponentIds.length;

        return { won, teamAvg, opponentAvg };
      });

      if (playerMatches.length === 0) return;

      // 2. Calculer le nouvel ELO impulsé par la session
      const metadata = (player.aiMetadata as Record<string, any>) || { matchesPlayed: 0 };
      const newAiLevel = computeSessionImpact(
        player.aiLevel,
        player.skillLevel,
        playerMatches,
        metadata.matchesPlayed || 0
      );

      // 3. Sauvegarder
      return prisma.player.update({
        where: { id: player.id },
        data: {
          aiLevel: newAiLevel,
          aiMetadata: {
            ...metadata,
            matchesPlayed: (metadata.matchesPlayed || 0) + playerMatches.length,
            lastUpdate: new Date().toISOString()
          }
        }
      });
    });

    await Promise.all(updates);

    revalidatePath(`/leagues/${session.leagueId}/players`);
    return { success: true };
  } catch (error) {
    logError("processSessionAiLevels", error);
    return { success: false, error: "Erreur lors du traitement IA des niveaux" };
  }
}

/**
 * Met à jour manuellement les niveaux d'un joueur.
 * Permet au gestionnaire d'ajuster tant le niveau manuel que le niveau IA.
 */
export async function updatePlayerLevels(
  playerId: string, 
  manualLevel: number, 
  aiLevel: number | null
) {
  try {
    const player = await prisma.player.findUnique({
      where: { id: playerId },
      select: { leagueId: true }
    });

    if (!player) return { success: false, error: "Joueur non trouvé" };

    await ensureLeagueManager(player.leagueId);

    await prisma.player.update({
      where: { id: playerId },
      data: {
        skillLevel: manualLevel,
        aiLevel: aiLevel,
        // On réinitialise éventuellement la confiance si le niveau est forcé manuellement ?
        // On laisse tel quel pour l'instant.
      }
    });

    revalidatePath(`/leagues/${player.leagueId}/players`);
    return { success: true };
  } catch (error) {
    logError("updatePlayerLevels", error);
    return { success: false, error: "Erreur lors de la mise à jour manuelle des niveaux" };
  }
}
