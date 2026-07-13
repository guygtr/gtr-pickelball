"use server";

import { prisma } from "@/lib/prisma";
import { ensurePrismaManager, ensureLeagueManager } from "@/lib/auth-utils";
import { logError } from "@/lib/logger";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";


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
      aiLevel: z.number().nullable().optional(),
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
            aiLevel: player.aiLevel ?? player.skillLevel,
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
              .filter((a) => playerIdMap[a.playerId])
              .map((a) => ({
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
 * Restaure une ligue complète à partir d'un backup JSON.
 * Gère la création d'une nouvelle ligue (Scénario 1).
 */
type LeagueBackup = {
  league: {
    name: string;
    description?: string | null;
    settings?: Record<string, unknown> | null;
  };
  players: Array<{
    id?: string;
    firstName: string;
    lastName: string;
    email?: string | null;
    phone?: string | null;
    level?: number;
    skillLevel?: number;
    aiLevel?: number | null;
    isActive?: boolean;
  }>;
  courts?: Array<{
    id?: string;
    name: string;
    note?: string | null;
    playerCapacity?: number;
  }>;
  sessions?: Array<Record<string, unknown>>;
};

function asLeagueBackup(data: unknown): LeagueBackup | null {
  if (!data || typeof data !== "object") return null;
  const d = data as Record<string, unknown>;
  if (!d.league || typeof d.league !== "object" || !Array.isArray(d.players)) {
    return null;
  }
  return data as LeagueBackup;
}

export async function restoreLeagueFromBackup(jsonData: unknown, importSessions: boolean = true) {
  const user = await ensurePrismaManager();
  const backup = asLeagueBackup(jsonData);

  if (!backup) {
    return { success: false, error: "Format de backup invalide." };
  }

  try {
    return await prisma.$transaction(async (tx) => {
      // 1. Création de la ligue
      const newLeague = await tx.league.create({
        data: {
          name: `${backup.league.name} (Restauré)`,
          description: backup.league.description,
          settings: (backup.league.settings as Prisma.InputJsonValue) || Prisma.JsonNull,
          managerId: user.id,
        },
      });

      const playerIdMap: Record<string, string> = {};
      const courtIdMap: Record<string, string> = {};

      // 2. Joueurs
      for (const p of backup.players) {
        const player = await tx.player.create({
          data: {
            firstName: p.firstName,
            lastName: p.lastName,
            email: p.email,
            phone: p.phone,
            skillLevel: p.level || p.skillLevel || 3.0,
            aiLevel: p.aiLevel ?? p.level ?? p.skillLevel ?? 3.0,
            isActive: p.isActive ?? true,
            leagueId: newLeague.id,
          },
        });
        if (p.id) playerIdMap[p.id] = player.id;
      }

      // 3. Terrains
      if (backup.courts) {
        for (const c of backup.courts) {
          const court = await tx.court.create({
            data: {
              name: c.name,
              note: c.note,
              playerCapacity: c.playerCapacity || 4,
              leagueId: newLeague.id,
            },
          });
          if (c.id) courtIdMap[c.id] = court.id;
        }
      }

      // 4. Sessions (Optionnel)
      if (importSessions && backup.sessions) {
        for (const s of backup.sessions) {
          const sess = s as {
            date: string;
            status: string;
            location?: string | null;
            maxPlayers: number;
            duration?: number | null;
            description?: string | null;
            settings?: Record<string, unknown> | null;
            attendances?: Array<{ playerId: string; isPresent: boolean }>;
            matches?: Array<{
              courtId?: string | null;
              startTime?: string | null;
              duration?: number | null;
              data?: Record<string, unknown> | null;
            }>;
          };
          const newSession = await tx.session.create({
            data: {
              date: new Date(sess.date),
              status: sess.status,
              location: sess.location,
              maxPlayers: sess.maxPlayers,
              duration: sess.duration,
              description: sess.description,
              settings: (sess.settings as Prisma.InputJsonValue) || Prisma.JsonNull,
              leagueId: newLeague.id,
            },
          });

          if (sess.attendances) {
            await tx.attendance.createMany({
              data: sess.attendances
                .filter((a) => playerIdMap[a.playerId])
                .map((a) => ({
                  sessionId: newSession.id,
                  playerId: playerIdMap[a.playerId],
                  isPresent: a.isPresent,
                })),
            });
          }

          if (sess.matches) {
            for (const m of sess.matches) {
              let updatedData = m.data;
              if (updatedData && typeof updatedData === "object") {
                const data = { ...updatedData } as Record<string, unknown>;
                if (Array.isArray(data.team1)) {
                  data.team1 = (data.team1 as string[]).map(
                    (id) => playerIdMap[id] || id
                  );
                }
                if (Array.isArray(data.team2)) {
                  data.team2 = (data.team2 as string[]).map(
                    (id) => playerIdMap[id] || id
                  );
                }
                updatedData = data;
              }
              await tx.match.create({
                data: {
                  sessionId: newSession.id,
                  courtId:
                    (m.courtId && courtIdMap[m.courtId]) ||
                    Object.values(courtIdMap)[0] ||
                    "",
                  startTime: m.startTime ? new Date(m.startTime) : null,
                  duration: m.duration,
                  data: updatedData
                    ? (updatedData as Prisma.InputJsonValue)
                    : Prisma.JsonNull,
                },
              });
            }
          }
        }
      }

      revalidatePath("/leagues");
      return { success: true, id: newLeague.id };
    }, { timeout: 60000 });
  } catch (error) {
    logError("restoreLeagueFromBackup", error);
    const msg = error instanceof Error ? error.message : "Erreur inconnue";
    return { success: false, error: msg };
  }
}

/**
 * Version intelligente de syncLeagueData avec options et détection de doublons fine.
 */
export async function smartImportIntoLeague(
    leagueId: string, 
    jsonData: unknown, 
    options: { players: boolean, sessions: boolean }
) {
  await ensureLeagueManager(leagueId);
  const backup = asLeagueBackup(jsonData);
  if (!backup) {
    return { success: false as const, error: "Format de backup invalide." };
  }

  try {
    return await prisma.$transaction(async (tx) => {
      const playerIdMap: Record<string, string> = {};
      let playersCreated = 0;
      let playersSkipped = 0;
      let sessionsCreated = 0;
      let sessionsSkipped = 0;

      // 1. Joueurs : Toujours construire le mapping pour garantir l'intégrité des relations
      if (backup.players) {
        for (const p of backup.players) {
          const existing = await tx.player.findFirst({
            where: {
              leagueId,
              firstName: p.firstName,
              lastName: p.lastName,
              email: p.email || null,
            }
          });

          if (existing) {
            if (p.id) playerIdMap[p.id] = existing.id;
            playersSkipped++;
          } else if (options.players || options.sessions) {
            // Création activée explicitement ou implicitement via les sessions
            const player = await tx.player.create({
              data: {
                firstName: p.firstName,
                lastName: p.lastName,
                email: p.email,
                phone: p.phone,
                skillLevel: p.level || p.skillLevel || 3.0,
                aiLevel: p.aiLevel ?? p.level ?? p.skillLevel ?? 3.0,
                isActive: p.isActive ?? true,
                leagueId,
              },
            });
            if (p.id) playerIdMap[p.id] = player.id;
            playersCreated++;
          }
        }
      }

      // 2. Terrains (essentiel pour les matchs si on importe les sessions)
      const courtIdMap: Record<string, string> = {};
      const existingCourts = await tx.court.findMany({ where: { leagueId } });
      if (backup.courts) {
        for (const c of backup.courts) {
          const existing = existingCourts.find(ec => ec.name === c.name);
          if (existing) {
            if (c.id) courtIdMap[c.id] = existing.id;
          } else {
             const court = await tx.court.create({
                data: {
                    name: c.name,
                    note: c.note,
                    playerCapacity: c.playerCapacity || 4,
                    leagueId,
                }
             });
             if (c.id) courtIdMap[c.id] = court.id;
          }
        }
      }

      // 3. Sessions (si activé)
      if (options.sessions && backup.sessions) {
        for (const raw of backup.sessions) {
          const s = raw as {
            date: string;
            status: string;
            location?: string | null;
            maxPlayers: number;
            duration?: number | null;
            description?: string | null;
            settings?: Record<string, unknown> | null;
            attendances?: Array<{ playerId: string; isPresent: boolean }>;
            matches?: Array<{
              courtId?: string | null;
              startTime?: string | null;
              duration?: number | null;
              data?: Record<string, unknown> | null;
            }>;
          };
          const sessionDate = new Date(s.date);
          const existing = await tx.session.findFirst({
            where: { 
                leagueId, 
                date: sessionDate // Détection exacte par Date
            }
          });

          if (existing) {
            sessionsSkipped++;
            continue;
          }

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
            },
          });
          sessionsCreated++;

          // Dépendances
          if (s.attendances) {
             await tx.attendance.createMany({
                data: s.attendances
                    .filter((a: { playerId: string }) => playerIdMap[a.playerId])
                    .map((a: { playerId: string, isPresent: boolean }) => ({
                        sessionId: newSession.id,
                        playerId: playerIdMap[a.playerId],
                        isPresent: a.isPresent,
                    })),
                skipDuplicates: true
             });
          }

          if (s.matches) {
            for (const m of s.matches) {
              let updatedData = m.data;
              if (updatedData && typeof updatedData === "object") {
                const data = { ...updatedData } as Record<string, unknown>;
                if (Array.isArray(data.team1)) {
                  data.team1 = (data.team1 as string[]).map(
                    (id) => playerIdMap[id] || id
                  );
                }
                if (Array.isArray(data.team2)) {
                  data.team2 = (data.team2 as string[]).map(
                    (id) => playerIdMap[id] || id
                  );
                }
                updatedData = data;
              }
              await tx.match.create({
                data: {
                  sessionId: newSession.id,
                  courtId:
                    (m.courtId && courtIdMap[m.courtId]) ||
                    existingCourts[0]?.id ||
                    "",
                  startTime: m.startTime ? new Date(m.startTime) : null,
                  duration: m.duration,
                  data: updatedData
                    ? (updatedData as Prisma.InputJsonValue)
                    : Prisma.JsonNull,
                },
              });
            }
          }
        }
      }

      revalidatePath(`/leagues/${leagueId}`);
      return {
        success: true as const,
        results: {
          players: { created: playersCreated, skipped: playersSkipped },
          sessions: { created: sessionsCreated, skipped: sessionsSkipped },
        },
      };
    }, { timeout: 60000 });
  } catch (error) {
    logError("smartImportIntoLeague", error);
    const msg = error instanceof Error ? error.message : "Erreur inconnue";
    return { success: false as const, error: msg };
  }
}
