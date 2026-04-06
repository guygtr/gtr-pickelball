"use server";

import { prisma } from "@/lib/prisma";
import { ensureLeagueManager } from "@/lib/auth-utils";
import { revalidatePath } from "next/cache";

export async function importLeaguePlayers(leagueId: string, players: any[]) {
    await ensureLeagueManager(leagueId);

    if (!Array.isArray(players)) {
        throw new Error("Format de données invalide : 'players' doit être un tableau.");
    }

    const results = {
        created: 0,
        updated: 0,
        errors: 0
    };

    for (const player of players) {
        try {
            // Validation minimale
            if (!player.firstName || !player.lastName) {
                results.errors++;
                continue;
            }

            // On cherche si le joueur existe déjà par email ou nom/prénom
            const existingPlayer = await prisma.player.findFirst({
                where: {
                    leagueId,
                    OR: [
                        { email: player.email || undefined },
                        { AND: [{ firstName: player.firstName }, { lastName: player.lastName }] }
                    ]
                }
            });

            if (existingPlayer) {
                await prisma.player.update({
                    where: { id: existingPlayer.id },
                    data: {
                        firstName: player.firstName,
                        lastName: player.lastName,
                        email: player.email || existingPlayer.email,
                        phone: player.phone || existingPlayer.phone,
                        skillLevel: player.level || player.skillLevel || existingPlayer.skillLevel,
                    }
                });
                results.updated++;
            } else {
                await prisma.player.create({
                    data: {
                        leagueId,
                        firstName: player.firstName,
                        lastName: player.lastName,
                        email: player.email || null,
                        phone: player.phone || null,
                        skillLevel: player.level || player.skillLevel || 3.0,
                    }
                });
                results.created++;
            }
        } catch (error) {
            console.error("Erreur lors de l'import d'un joueur:", error);
            results.errors++;
        }
    }

    revalidatePath(`/leagues/${leagueId}/players`);
    revalidatePath(`/leagues/${leagueId}/settings`);
    
    return { success: true, results };
}
