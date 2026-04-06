"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const PlayerSchema = z.object({
  leagueId: z.string(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  skillLevel: z.number().min(1).max(6).default(3.0),
});

export async function createPlayer(data: z.infer<typeof PlayerSchema>) {
  const validated = PlayerSchema.parse(data);
  
  const player = await prisma.player.create({
    data: {
      ...validated,
      email: validated.email || null,
      phone: validated.phone || null,
    },
  });

  revalidatePath(`/leagues/${validated.leagueId}/players`);
  return player;
}

export interface PlayerImportData {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  skillLevel: string | number;
}

export async function importPlayers(leagueId: string, players: PlayerImportData[]) {
  const operations = players.map((p: PlayerImportData) => {
    return prisma.player.create({
      data: {
        leagueId,
        firstName: p.firstName || "Inconnu",
        lastName: p.lastName || "Joueur",
        email: p.email || null,
        phone: p.phone || null,
        skillLevel: typeof p.skillLevel === 'string' ? parseFloat(p.skillLevel) : (p.skillLevel || 3.0),
      }
    });
  });

  await prisma.$transaction(operations);
  revalidatePath(`/leagues/${leagueId}/players`);
}
