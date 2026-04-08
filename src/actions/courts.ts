"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { ensureLeagueManager } from "@/lib/auth-utils";
import { z } from "zod";

export async function addCourt(leagueId: string) {
  try {
    await ensureLeagueManager(leagueId);
    const count = await prisma.court.count({ where: { leagueId } });
    await prisma.court.create({
      data: {
        name: `Terrain ${count + 1}`,
        leagueId,
      }
    });
    revalidatePath(`/leagues/${leagueId}/settings`);
    return { success: true };
  } catch (error) {
    console.error("Error adding court:", error);
    return { success: false, error: "Erreur lors de l'ajout du terrain" };
  }
}

export async function renameCourt(courtId: string, name: string, leagueId: string) {
  try {
    await ensureLeagueManager(leagueId);
    const validatedName = z.string().min(1).max(50).parse(name);

    await prisma.court.update({
      where: { id: courtId, leagueId },
      data: { name: validatedName }
    });
    revalidatePath(`/leagues/${leagueId}/settings`);
    return { success: true };
  } catch (error) {
    console.error("Error renaming court:", error);
    return { success: false, error: "Erreur lors du renommage" };
  }
}

export async function deleteCourt(courtId: string, leagueId: string) {
  try {
    await ensureLeagueManager(leagueId);
    
    const count = await prisma.court.count({ where: { leagueId } });
    if (count <= 1) return { success: false, error: "Une ligue doit avoir au moins un terrain." };
    
    await prisma.court.delete({
      where: { id: courtId, leagueId }
    });
    revalidatePath(`/leagues/${leagueId}/settings`);
    return { success: true };
  } catch (error) {
    console.error("Error deleting court:", error);
    return { success: false, error: "Erreur lors de la suppression" };
  }
}
