"use server";

import { prisma } from "@/lib/prisma";
import { playerSchema, playerImportSchema, PlayerInput } from "@/lib/validations/player";
import { revalidatePath } from "next/cache";

/**
 * Action pour ajouter un joueur manuellement.
 */
export async function addPlayer(data: PlayerInput) {
  try {
    const validated = playerSchema.parse(data);
    
    const player = await prisma.player.create({
      data: {
        firstName: validated.firstName,
        lastName: validated.lastName,
        email: validated.email || null,
        phone: validated.phone || null,
        skillLevel: validated.skillLevel,
        leagueId: validated.leagueId,
      },
    });

    revalidatePath(`/leagues/${validated.leagueId}/players`);
    return { success: true, player };
  } catch (error) {
    console.error("Error adding player:", error);
    return { success: false, error: "Impossible d'ajouter le joueur" };
  }
}

/**
 * Action pour importer des joueurs en masse (CSV).
 */
export async function importPlayers(leagueId: string, players: Record<string, unknown>[]) {
  try {
    // Note: 'any' car on reçoit des données brutes du CSV qu'on valide ensuite
    const validatedPlayers = players.map(p => ({
      firstName: String(p.firstName || ""),
      lastName: String(p.lastName || ""),
      email: p.email ? String(p.email) : "",
      phone: p.phone ? String(p.phone) : "",
      skillLevel: p.skillLevel ? parseFloat(String(p.skillLevel)) : 2.0,
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
    console.error("Error importing players:", error);
    return { success: false, error: "L'importation a échoué" };
  }
}

/**
 * Action pour archiver/supprimer un joueur.
 */
export async function deletePlayer(playerId: string, leagueId: string) {
  try {
    await prisma.player.delete({
      where: { id: playerId },
    });

    revalidatePath(`/leagues/${leagueId}/players`);
    return { success: true };
  } catch (error) {
    console.error("Error deleting player:", error);
    return { success: false, error: "Impossible de supprimer le joueur" };
  }
}
