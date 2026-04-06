"use server";

import { prisma } from "@/lib/prisma";
import { ensureLeagueManager } from "@/lib/auth-utils";
import { revalidatePath } from "next/cache";

/**
 * Met à jour le résultat d'un match (gagnant).
 * 
 * @param matchId ID du match
 * @param winner 1 (Team 1), 2 (Team 2), 0 (Nul)
 */
export async function updateMatchResult(matchId: string, winner: number) {
  try {
    // 1. Récupérer le match pour trouver la ligue associée (via session)
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        session: {
          select: { leagueId: true }
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
