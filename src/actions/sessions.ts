"use server";

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { sessionSchema } from "@/lib/validations/session";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ensureLeagueManager } from "@/lib/auth-utils";
import { logError } from "@/lib/logger";
import { processSessionAiLevels } from "./ai-level";

/**
 * Crée une nouvelle session de jeu pour une ligue.
 * @param {z.infer<typeof sessionSchema>} data Données de la session validées.
 */
export async function createSession(data: z.infer<typeof sessionSchema>) {
  try {
    const validated = sessionSchema.parse(data);
    await ensureLeagueManager(validated.leagueId);
    
    const session = await prisma.session.create({
      data: {
        leagueId: validated.leagueId,
        date: new Date(validated.date),
        location: validated.location || null,
        maxPlayers: validated.maxPlayers,
        duration: validated.duration || null,
        iterations: validated.iterations,
        description: validated.description || null,
        status: "PLANNED",
      } as Prisma.SessionUncheckedCreateInput,
    });

    revalidatePath(`/leagues/${validated.leagueId}/sessions`);
    return { success: true, session };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Erreur inconnue lors de la création de la session";
    logError("createSession", error);
    return { success: false, error: errorMessage };
  }
}

export async function getSessions(leagueId: string) {
  await ensureLeagueManager(leagueId);
  
  return await prisma.session.findMany({
    where: { leagueId },
    orderBy: { date: "desc" },
  });
}

/**
 * Supprime une session spécifique.
 * @param {string} sessionId ID de la session.
 */
export async function deleteSession(sessionId: string) {
  try {
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      select: { leagueId: true }
    });

    if (!session) return { success: false, error: "Session non trouvée" };

    await ensureLeagueManager(session.leagueId);

    await prisma.session.delete({
      where: { id: sessionId }
    });

    revalidatePath(`/leagues/${session.leagueId}/sessions`);
    return { success: true };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Erreur inconnue lors de la suppression";
    logError("deleteSession", error);
    return { success: false, error: errorMessage };
  }
}

/**
 * Force la fin d'une session prématurément, ce qui empêchera de générer de nouveaux matchs.
 * @param {string} sessionId ID de la session.
 */
export async function terminateSession(sessionId: string) {
  try {
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      select: { leagueId: true }
    });

    if (!session) return { success: false, error: "Session non trouvée" };

    await ensureLeagueManager(session.leagueId);

    await prisma.session.update({
      where: { id: sessionId },
      data: { status: "COMPLETED" }
    });

    // DÉCLENCHEUR IA : Recalculer les niveaux de performance
    // On le fait de manière asynchrone pour ne pas bloquer l'UI, 
    // ou bloquante si on veut être sûr que les données sont prêtes.
    // Ici, on attend pour garantir la cohérence avant le rafraîchissement.
    await processSessionAiLevels(sessionId);

    revalidatePath(`/leagues/${session.leagueId}/sessions/${sessionId}`);
    revalidatePath(`/leagues/${session.leagueId}/sessions`);
    
    return { success: true };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
    logError("terminateSession", error);
    return { success: false, error: errorMessage };
  }
}
