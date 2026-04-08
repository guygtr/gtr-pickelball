"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getEnsuredUser } from "@/lib/auth-utils";

/**
 * Ajoute un co-gestionnaire à une ligue via son adresse email.
 */
export async function addCoManager(leagueId: string, email: string) {
  try {
    const currentUser = await getEnsuredUser();

    // 1. Vérifier que l'utilisateur actuel est le PROPRIÉTAIRE (seul le propriétaire peut ajouter des co-gestionnaires)
    const league = await prisma.league.findUnique({
      where: { id: leagueId },
      select: { managerId: true }
    });

    if (!league) throw new Error("Ligue non trouvée.");
    if (league.managerId !== currentUser.id) {
      throw new Error("Seul le propriétaire de la ligue peut ajouter des co-gestionnaires.");
    }

    // 2. Chercher le gestionnaire cible
    const targetManager = await prisma.manager.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!targetManager) {
      return { 
        success: false, 
        error: "Ce gestionnaire n'existe pas. Il doit s'être connecté au moins une fois à la plateforme." 
      };
    }

    if (targetManager.id === currentUser.id) {
      return { success: false, error: "Vous êtes déjà le propriétaire de cette ligue." };
    }

    // 3. Créer la relation
    await prisma.coManager.upsert({
      where: {
        leagueId_managerId: {
          leagueId,
          managerId: targetManager.id,
        }
      },
      update: {},
      create: {
        leagueId,
        managerId: targetManager.id,
      }
    });

    revalidatePath(`/leagues/${leagueId}/settings`);
    return { success: true };
  } catch (error: any) {
    console.error("Erreur addCoManager:", error);
    return { success: false, error: error.message || "Une erreur est survenue." };
  }
}

/**
 * Retire un co-gestionnaire d'une ligue.
 */
export async function removeCoManager(leagueId: string, managerId: string) {
  try {
    const currentUser = await getEnsuredUser();

    // Vérifier les droits (Propriétaire uniquement)
    const league = await prisma.league.findUnique({
      where: { id: leagueId },
      select: { managerId: true }
    });

    if (!league) throw new Error("Ligue non trouvée.");
    if (league.managerId !== currentUser.id) {
      throw new Error("Seul le propriétaire peut retirer des co-gestionnaires.");
    }

    await prisma.coManager.delete({
      where: {
        leagueId_managerId: {
          leagueId,
          managerId,
        }
      }
    });

    revalidatePath(`/leagues/${leagueId}/settings`);
    return { success: true };
  } catch (error: any) {
    console.error("Erreur removeCoManager:", error);
    return { success: false, error: "Impossible de retirer le gestionnaire." };
  }
}
