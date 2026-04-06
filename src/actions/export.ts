"use server";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { prisma } from "@/lib/prisma";
import { getEnsuredUser, ensureLeagueManager } from "@/lib/auth-utils";

export async function exportLeagueData(leagueId: string) {
  await ensureLeagueManager(leagueId);

  const league = await prisma.league.findUnique({
    where: { id: leagueId },
    include: {
      players: true,
      sessions: {
        include: {
          matches: {
            include: {
              court: true,
            }
          },
        }
      },
      courts: true,
    }
  });

  if (!league) {
    throw new Error("Ligue introuvable");
  }

  // Nettoyage des données pour l'exportation
  const exportData = {
    exportDate: new Date().toISOString(),
    league: {
      id: league.id,
      name: league.name,
      description: league.description,
      settings: league.settings,
      createdAt: league.createdAt,
    },
    players: league.players.map((p: any) => ({
      id: p.id,
      firstName: p.firstName,
      lastName: p.lastName,
      email: p.email,
      phone: p.phone,
      level: p.skillLevel,
      joinedAt: p.createdAt,
    })),
    sessions: league.sessions.map((s: any) => ({
      id: s.id,
      date: s.date,
      status: s.status,
      location: s.location,
      maxPlayers: s.maxPlayers,
      duration: s.duration,
      description: s.description,
      settings: s.settings,
      matches: s.matches.map((m: any) => ({
        id: m.id,
        court: (m.court as any)?.name || "N/A",
        startTime: m.startTime,
        duration: m.duration,
        data: m.data,
      }))
    })),
    courts: league.courts.map((c: any) => ({
      id: c.id,
      name: c.name,
      note: c.note,
      capacity: c.playerCapacity,
    })),
  };

  return exportData;
}

export async function exportUserData() {
  const user = await getEnsuredUser();

  const managedLeagues = await prisma.league.findMany({
    where: { managerId: user.id },
    include: {
      players: true,
      sessions: {
        include: {
          matches: true
        }
      }
    }
  });

  return {
    exportDate: new Date().toISOString(),
    user: {
      id: user.id,
      email: user.email,
    },
    managedLeagues: managedLeagues.map((l: any) => ({
      id: l.id,
      name: l.name,
      description: l.description,
      playerCount: l.players.length,
      sessionCount: l.sessions.length,
      createdAt: l.createdAt,
    })),
  };
}
