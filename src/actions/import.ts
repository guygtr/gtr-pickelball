"use server";

import { prisma } from "@/lib/prisma";
import { getEnsuredUser } from "@/lib/auth-utils";
import { z } from "zod";
import { revalidatePath } from "next/cache";

// Schéma de validation pour l'importation
const ImportSchema = z.object({
  exportVersion: z.string().optional(),
  leagues: z.array(z.object({
    name: z.string(),
    description: z.string().nullable().optional(),
    settings: z.any().nullable().optional(),
    players: z.array(z.object({
      id: z.string(),
      firstName: z.string(),
      lastName: z.string(),
      email: z.string().nullable().optional(),
      phone: z.string().nullable().optional(),
      skillLevel: z.number(),
      isActive: z.boolean(),
    })).optional().default([]),
    courts: z.array(z.object({
      id: z.string(),
      name: z.string(),
      note: z.string().nullable().optional(),
      playerCapacity: z.number(),
    })).optional().default([]),
    sessions: z.array(z.object({
      id: z.string(),
      date: z.string(),
      status: z.string(),
      location: z.string().nullable().optional(),
      maxPlayers: z.number(),
      duration: z.number().nullable().optional(),
      description: z.string().nullable().optional(),
      settings: z.any().nullable().optional(),
      attendances: z.array(z.object({
        playerId: z.string(),
        isPresent: z.boolean(),
      })).optional().default([]),
      matches: z.array(z.object({
        id: z.string(),
        courtId: z.string().nullable().optional(),
        startTime: z.string().nullable().optional(),
        duration: z.number().nullable().optional(),
        data: z.any().nullable().optional(),
      })).optional().default([]),
    })).optional().default([]),
  }))
});

/**
 * Importe l'intégralité des ligues depuis un objet JSON.
 * Gère le remappage des IDs pour préserver les relations.
 */
export async function importUserData(jsonData: unknown) {
  const user = await getEnsuredUser();
  
  // Validation des données
  const validatedData = ImportSchema.parse(jsonData);
  
  let importedCount = 0;

  await prisma.$transaction(async (tx: any) => {
    for (const leagueData of validatedData.leagues) {
      // 1. Création de la ligue
      const newLeague = await tx.league.create({
        data: {
          name: `${leagueData.name} (Importé)`,
          description: leagueData.description,
          settings: leagueData.settings || {},
          managerId: user.id,
        },
      });

      const playerIdMap: Record<string, string> = {};
      const courtIdMap: Record<string, string> = {};

      // 2. Création des joueurs
      for (const player of leagueData.players) {
        const newPlayer = await tx.player.create({
          data: {
            firstName: player.firstName,
            lastName: player.lastName,
            email: player.email,
            phone: player.phone,
            skillLevel: player.skillLevel,
            isActive: player.isActive,
            leagueId: newLeague.id,
          },
        });
        playerIdMap[player.id] = newPlayer.id;
      }

      // 3. Création des terrains
      for (const court of leagueData.courts) {
        const newCourt = await tx.court.create({
          data: {
            name: court.name,
            note: court.note,
            playerCapacity: court.playerCapacity,
            leagueId: newLeague.id,
          },
        });
        courtIdMap[court.id] = newCourt.id;
      }

      // 4. Création des sessions et leurs dépendances
      for (const session of leagueData.sessions) {
        const newSession = await tx.session.create({
          data: {
            date: new Date(session.date),
            status: session.status,
            location: session.location,
            maxPlayers: session.maxPlayers,
            duration: session.duration,
            description: session.description,
            settings: session.settings || {},
            leagueId: newLeague.id,
          },
        });

        // 4a. Présences
        if (session.attendances.length > 0) {
          await tx.attendance.createMany({
            data: session.attendances
              .filter(a => playerIdMap[a.playerId]) // Sécurité
              .map(a => ({
                sessionId: newSession.id,
                playerId: playerIdMap[a.playerId],
                isPresent: a.isPresent,
              })),
          });
        }

        // 4b. Matchs
        for (const match of session.matches) {
          // Mise à jour des playerIds dans l'objet data du match
          let updatedData = match.data;
          if (updatedData && typeof updatedData === 'object') {
            const data = { ...updatedData };
            if (Array.isArray(data.team1)) {
              data.team1 = data.team1.map((pId: string) => playerIdMap[pId] || pId);
            }
            if (Array.isArray(data.team2)) {
              data.team2 = data.team2.map((pId: string) => playerIdMap[pId] || pId);
            }
            updatedData = data;
          }

          await tx.match.create({
            data: {
              sessionId: newSession.id,
              courtId: match.courtId ? courtIdMap[match.courtId] : (Object.values(courtIdMap)[0] || ""), // Fallback si pas de courtId ou remappage
              startTime: match.startTime ? new Date(match.startTime) : null,
              duration: match.duration,
              data: updatedData,
            },
          });
        }
      }
      importedCount++;
    }
  }, {
    timeout: 30000, // Augmenter le timeout pour les gros imports
  });

  revalidatePath("/leagues");
  revalidatePath("/settings");

  return { success: true, count: importedCount };
}

/**
 * Importe des joueurs dans une ligue existante.
 * Utilisé par ImportExportCard.
 */
export async function importLeaguePlayers(leagueId: string, players: any[]) {
  await getEnsuredUser();
  
  let created = 0;
  let updated = 0;

  for (const player of players) {
    // Recherche par email ou nom pour éviter les doublons
    const existing = await prisma.player.findFirst({
      where: {
        leagueId,
        firstName: player.firstName,
        lastName: player.lastName,
      }
    });

    if (existing) {
      await prisma.player.update({
        where: { id: existing.id },
        data: {
          email: player.email || existing.email,
          phone: player.phone || existing.phone,
          skillLevel: player.skillLevel ?? existing.skillLevel,
          isActive: player.isActive ?? existing.isActive,
        }
      });
      updated++;
    } else {
      await prisma.player.create({
        data: {
          firstName: player.firstName,
          lastName: player.lastName,
          email: player.email,
          phone: player.phone,
          skillLevel: player.skillLevel ?? 3.0,
          isActive: player.isActive ?? true,
          leagueId,
        }
      });
      created++;
    }
  }

  revalidatePath(`/leagues/${leagueId}`);
  return { success: true, results: { created, updated } };
}
