"use server";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { ensureLeagueManager } from "@/lib/auth-utils";

export async function createPlayer(data: {
  leagueId: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  skillLevel: number;
}) {
  await ensureLeagueManager(data.leagueId);

  const player = await prisma.player.create({
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      skillLevel: data.skillLevel,
      leagueId: data.leagueId,
    },
  });

  revalidatePath(`/leagues/${data.leagueId}/players`);
  return player;
}

export async function importPlayers(leagueId: string, players: any[]) {
  await ensureLeagueManager(leagueId);

  const createdPlayers = await prisma.$transaction(
    players.map((p) =>
      prisma.player.create({
        data: {
          firstName: p.firstName,
          lastName: p.lastName,
          email: p.email,
          phone: p.phone,
          skillLevel: parseFloat(p.skillLevel) || 3.0,
          leagueId,
        },
      })
    )
  );

  revalidatePath(`/leagues/${leagueId}/players`);
  return { success: true, count: createdPlayers.length };
}

export async function updatePlayer(data: {
  id: string;
  leagueId: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  skillLevel: number;
}) {
  await ensureLeagueManager(data.leagueId);

  const player = await prisma.player.update({
    where: { id: data.id, leagueId: data.leagueId },
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      skillLevel: data.skillLevel,
    },
  });

  revalidatePath(`/leagues/${data.leagueId}/players`);
  revalidatePath(`/leagues/${data.leagueId}`);
  return player;
}

export async function deletePlayer(leagueId: string, playerId: string) {
  await ensureLeagueManager(leagueId);

  await prisma.player.delete({
    where: {
      id: playerId,
      leagueId: leagueId,
    },
  });

  revalidatePath(`/leagues/${leagueId}/players`);
}
