"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { ensureLeagueManager } from "@/lib/auth-utils";
import { z } from "zod";

export async function addCourt(leagueId: string) {
  await ensureLeagueManager(leagueId);
  const count = await prisma.court.count({ where: { leagueId } });
  await prisma.court.create({
    data: {
      name: `Terrain ${count + 1}`,
      leagueId,
    }
  });
  revalidatePath(`/leagues/${leagueId}/settings`);
}

export async function renameCourt(courtId: string, name: string, leagueId: string) {
  await ensureLeagueManager(leagueId);
  
  const validatedName = z.string().min(1).max(50).parse(name);

  await prisma.court.update({
    where: { id: courtId, leagueId },
    data: { name: validatedName }
  });
  revalidatePath(`/leagues/${leagueId}/settings`);
}

export async function deleteCourt(courtId: string, leagueId: string) {
  await ensureLeagueManager(leagueId);
  
  const count = await prisma.court.count({ where: { leagueId } });
  if (count <= 1) throw new Error("Une ligue doit avoir au moins un terrain.");
  
  await prisma.court.delete({
    where: { id: courtId, leagueId }
  });
  revalidatePath(`/leagues/${leagueId}/settings`);
}
