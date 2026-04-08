"use server";

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { sessionSchema } from "@/lib/validations/session";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ensureLeagueManager } from "@/lib/auth-utils";

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
    console.error("Error creating session:", errorMessage);
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
    console.error("Error deleting session:", errorMessage);
    return { success: false, error: errorMessage };
  }
}
