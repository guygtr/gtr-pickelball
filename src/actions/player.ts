"use server";

import { prisma } from "@/lib/prisma";
import { playerSchema, playerImportSchema, PlayerInput } from "@/lib/validations/player";
import { revalidatePath } from "next/cache";
import { ensureLeagueManager } from "@/lib/auth-utils";
import { logError } from "@/lib/logger";

/**
 * Action pour ajouter un joueur manuellement.
 */
export async function createPlayer(data: PlayerInput) {
  try {
    const validated = playerSchema.parse(data);
    await ensureLeagueManager(validated.leagueId);
    
    const player = await prisma.player.create({
      data: {
        firstName: validated.firstName,
        lastName: validated.lastName,
        email: validated.email || null,
        phone: validated.phone || null,
        skillLevel: validated.skillLevel,
        type: validated.type,
        leagueId: validated.leagueId,
      },
    });

    revalidatePath(`/leagues/${validated.leagueId}/players`);
    return { success: true, player };
  } catch (error) {
    logError("createPlayer", error);
    return { success: false, error: "Impossible d'ajouter le joueur" };
  }
}

/**
 * Action pour importer des joueurs en masse (CSV).
 */
export async function importPlayers(leagueId: string, players: Record<string, unknown>[]) {
  try {
    await ensureLeagueManager(leagueId);
    
    // Note: 'any' car on reçoit des données brutes du CSV qu'on valide ensuite
    const validatedPlayers = players.map(p => ({
      firstName: String(p.firstName || ""),
      lastName: String(p.lastName || ""),
      email: p.email ? String(p.email) : "",
      phone: p.phone ? String(p.phone) : "",
      skillLevel: p.skillLevel ? parseFloat(String(p.skillLevel)) : 2.0,
      type: (p.type === "remplacant" || p.type === "permanent") ? p.type : "permanent",
    }));

    // Validation Zod de l'ensemble
    playerImportSchema.parse(validatedPlayers);

    // Insertion groupée (transaction)
    await prisma.player.createMany({
      data: validatedPlayers.map(p => ({
        ...p,
        email: p.email || null,
        phone: p.phone || null,
        leagueId,
      })),
    });

    revalidatePath(`/leagues/${leagueId}/players`);
    return { success: true, count: validatedPlayers.length };
  } catch (error) {
    logError("importPlayers", error);
    return { success: false, error: "L'importation a échoué" };
  }
}

/**
 * Action pour archiver/supprimer un joueur.
 */
export async function deletePlayer(playerId: string, leagueId: string) {
  try {
    await ensureLeagueManager(leagueId);
    
    await prisma.player.delete({
      where: { id: playerId, leagueId: leagueId },
    });

    revalidatePath(`/leagues/${leagueId}/players`);
    return { success: true };
  } catch (error) {
    logError("deletePlayer", error);
    return { success: false, error: "Impossible de supprimer le joueur" };
  }
}

/**
 * Met à jour un joueur existant.
 */
export async function updatePlayer(playerId: string, data: PlayerInput) {
  try {
    const validated = playerSchema.parse(data);
    await ensureLeagueManager(validated.leagueId);
    
    await prisma.player.update({
      where: { id: playerId, leagueId: validated.leagueId },
      data: {
        firstName: validated.firstName,
        lastName: validated.lastName,
        email: validated.email || null,
        phone: validated.phone || null,
        skillLevel: validated.skillLevel,
        type: validated.type,
      },
    });

    revalidatePath(`/leagues/${validated.leagueId}/players`);
    return { success: true };
  } catch (error) {
    logError("updatePlayer", error);
    return { success: false, error: "Impossible de mettre à jour le joueur" };
  }
}
