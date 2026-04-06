"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function addCourt(leagueId: string) {
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
  await prisma.court.update({
    where: { id: courtId },
    data: { name }
  });
  revalidatePath(`/leagues/${leagueId}/settings`);
}

export async function deleteCourt(courtId: string, leagueId: string) {
  const count = await prisma.court.count({ where: { leagueId } });
  if (count <= 1) throw new Error("Une ligue doit avoir au moins un terrain.");
  
  await prisma.court.delete({
    where: { id: courtId }
  });
  revalidatePath(`/leagues/${leagueId}/settings`);
}
