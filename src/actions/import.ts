"use server";

import { prisma } from "@/lib/prisma";
import { getEnsuredUser, ensureLeagueManager, ensurePrismaManager } from "@/lib/auth-utils";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { getNearestSkillLevel } from "@/lib/constants";

// Schéma de validation pour l'importation
const ImportSchema = z.object({
  exportVersion: z.string().optional(),
  leagues: z.array(z.object({
    name: z.string(),
    description: z.string().nullable().optional(),
    settings: z.record(z.string(), z.unknown()).nullable().optional(),
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
      settings: z.record(z.string(), z.unknown()).nullable().optional(),
      attendances: z.array(z.object({
        playerId: z.string(),
        isPresent: z.boolean(),
      })).optional().default([]),
      matches: z.array(z.object({
        id: z.string(),
        courtId: z.string().nullable().optional(),
        startTime: z.string().nullable().optional(),
        duration: z.number().nullable().optional(),
        data: z.record(z.string(), z.unknown()).nullable().optional(),
      })).optional().default([]),
    })).optional().default([]),
  }))
});

/**
 * Importe l'intégralité des ligues depuis un objet JSON.
 * Gère le remappage des IDs pour préserver les relations.
 */
export async function importUserData(jsonData: unknown) {
  const user = await ensurePrismaManager();
  
  // Validation des données
  const validatedData = ImportSchema.parse(jsonData);
  
  let importedCount = 0;

  await prisma.$transaction(async (tx) => {
    for (const leagueData of validatedData.leagues) {
      // 1. Création de la ligue
      const newLeague = await tx.league.create({
        data: {
          name: `${leagueData.name} (Importé)`,
          description: leagueData.description,
          settings: (leagueData.settings as Prisma.InputJsonValue) || Prisma.JsonNull,
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
            settings: (session.settings as Prisma.InputJsonValue) || Prisma.JsonNull,
            leagueId: newLeague.id,
          },
        });

        // 4a. Présences
        if (session.attendances && session.attendances.length > 0) {
          await tx.attendance.createMany({
            data: session.attendances
              .filter((a: any) => playerIdMap[a.playerId])
              .map((a: any) => ({
                sessionId: newSession.id,
                playerId: playerIdMap[a.playerId],
                isPresent: a.isPresent,
              })),
            skipDuplicates: true
          });
        }

        // 4b. Matchs
        if (session.matches && session.matches.length > 0) {
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
                courtId: match.courtId ? (courtIdMap[match.courtId] || Object.values(courtIdMap)[0] || "") : (Object.values(courtIdMap)[0] || ""),
                startTime: match.startTime ? new Date(match.startTime) : null,
                duration: match.duration,
                data: updatedData ? (updatedData as Prisma.InputJsonValue) : Prisma.JsonNull,
              },
            });
          }
        }
      }
      importedCount++;
    }
  }, {
    timeout: 60000, // Augmenter encore le timeout pour les gros imports globaux
  });

  revalidatePath("/leagues");
  revalidatePath("/settings");

  return { success: true, count: importedCount };
}

/**
 * Importe des joueurs dans une ligue existante.
 * Utilisé par ImportExportCard.
 */
export async function importLeaguePlayers(
  leagueId: string, 
  players: Array<{
    firstName: string;
    lastName: string;
    email?: string | null;
    phone?: string | null;
    skillLevel?: number;
    isActive?: boolean;
  }>
) {
  await ensureLeagueManager(leagueId);
  
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
          skillLevel: player.skillLevel !== undefined ? getNearestSkillLevel(player.skillLevel) : existing.skillLevel,
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
          skillLevel: player.skillLevel !== undefined ? getNearestSkillLevel(player.skillLevel) : 3.0,
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

/**
 * Synchronise l'intégralité des données d'une ligue existante à partir d'un export.
 * Gère le remappage des IDs pour restaurer les relations complexes (sessions, matchs, présences).
 */
export async function syncLeagueData(leagueId: string, jsonData: any) {
  await ensureLeagueManager(leagueId);
  
  // Validation sommaire de la structure - on s'attend au format exportLeagueData
  if (!jsonData.players || !jsonData.sessions) {
    return { success: false, error: "Format de données invalide pour une synchronisation de ligue." };
  }

  try {
    return await prisma.$transaction(async (tx) => {
      // 1. Synchronisation des Joueurs
      const playerIdMap: Record<string, string> = {};
      for (const p of jsonData.players) {
        const existing = await tx.player.findFirst({
          where: {
            leagueId,
            firstName: p.firstName,
            lastName: p.lastName,
          }
        });

        let targetPlayer;
        if (existing) {
          targetPlayer = await tx.player.update({
            where: { id: existing.id },
            data: {
              email: p.email || existing.email,
              phone: p.phone || existing.phone,
              skillLevel: getNearestSkillLevel(p.level || p.skillLevel || existing.skillLevel),
              isActive: p.isActive ?? existing.isActive,
            }
          });
        } else {
          targetPlayer = await tx.player.create({
            data: {
              firstName: p.firstName,
              lastName: p.lastName,
              email: p.email,
              phone: p.phone,
              skillLevel: getNearestSkillLevel(p.level || p.skillLevel || 3.0),
              isActive: p.isActive ?? true,
              leagueId,
            }
          });
        }
        playerIdMap[p.id] = targetPlayer.id;
      }

      // 2. Synchronisation des Terrains
      const courtIdMap: Record<string, string> = {};
      const actualCourts = await tx.court.findMany({ where: { leagueId } });
      
      if (jsonData.courts) {
        for (const c of jsonData.courts) {
          const existing = actualCourts.find(ac => ac.name === c.name);
          let targetCourt;
          if (existing) {
            targetCourt = await tx.court.update({
              where: { id: existing.id },
              data: {
                note: c.note || existing.note,
                playerCapacity: c.playerCapacity || c.capacity || existing.playerCapacity,
              }
            });
          } else {
            targetCourt = await tx.court.create({
              data: {
                name: c.name,
                note: c.note,
                playerCapacity: c.playerCapacity || c.capacity || 4,
                leagueId,
              }
            });
          }
          courtIdMap[c.id] = targetCourt.id;
        }
      }

      // 3. Synchronisation des Sessions
      let sessionsRestored = 0;
      let matchesRestored = 0;

      for (const s of jsonData.sessions) {
        const sessionDate = new Date(s.date);
        
        // On cherche une session à la même date/heure (plus ou moins quelques secondes)
        const existingSession = await tx.session.findFirst({
          where: {
            leagueId,
            date: {
              equals: sessionDate
            }
          }
        });

        let targetSessionId: string;
        if (existingSession) {
          // Si la session existe, on ne la recrée pas pour éviter les doublons de matchs
          // Mais on pourrait vouloir mettre à jour ses métadonnées
          targetSessionId = existingSession.id;
        } else {
          const newSession = await tx.session.create({
            data: {
              date: sessionDate,
              status: s.status,
              location: s.location,
              maxPlayers: s.maxPlayers,
              duration: s.duration,
              description: s.description,
              settings: (s.settings as Prisma.InputJsonValue) || Prisma.JsonNull,
              leagueId,
            }
          });
          targetSessionId = newSession.id;
          sessionsRestored++;

          // 4. Dépendances de la Session (uniquement si session nouvellement créée)
          
          // 4a. Présences
          if (s.attendances && s.attendances.length > 0) {
            await tx.attendance.createMany({
              data: s.attendances
                .filter((a: any) => playerIdMap[a.playerId])
                .map((a: any) => ({
                  sessionId: targetSessionId,
                  playerId: playerIdMap[a.playerId],
                  isPresent: a.isPresent,
                })),
              skipDuplicates: true
            });
          }

          // 4b. Matchs
          if (s.matches && s.matches.length > 0) {
            for (const m of s.matches) {
              // Remappage des joueurs dans le JSON data
              let updatedData = m.data;
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
                  sessionId: targetSessionId,
                  courtId: courtIdMap[m.courtId] || (actualCourts[0]?.id || ""),
                  startTime: m.startTime ? new Date(m.startTime) : null,
                  duration: m.duration,
                  data: updatedData ? (updatedData as Prisma.InputJsonValue) : Prisma.JsonNull,
                }
              });
              matchesRestored++;
            }
          }
        }
      }

      revalidatePath(`/leagues/${leagueId}`);
      revalidatePath(`/leagues/${leagueId}/sessions`);
      
      return { 
        success: true, 
        results: { 
          sessions: sessionsRestored, 
          matches: matchesRestored,
          players: Object.keys(playerIdMap).length 
        } 
      };
    }, {
      timeout: 30000
    });
  } catch (error: any) {
    console.error("Sync error:", error);
    return { success: false, error: error.message || "Erreur lors de la synchronisation des données" };
  }
}
