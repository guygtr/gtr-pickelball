"use server";

import { prisma } from "@/lib/prisma";
import { leagueSchema } from "@/lib/validations/league";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ensurePrismaManager, ensureLeagueManager } from "@/lib/auth-utils";

export async function createLeague(formData: FormData) {
  const user = await ensurePrismaManager();

  const rawData = {
    name: formData.get("name"),
    description: formData.get("description"),
    maxPlayers: formData.get("maxPlayers"),
    levelMin: formData.get("levelMin"),
    levelMax: formData.get("levelMax"),
    courtCount: formData.get("courtCount"),
  };

  const validatedData = leagueSchema.parse(rawData);

  await prisma.league.create({
    data: {
      name: validatedData.name,
      description: validatedData.description,
      settings: {
        maxPlayers: validatedData.maxPlayers,
        levelMin: validatedData.levelMin || 2.0,
        levelMax: validatedData.levelMax || 5.0,
      },
      managerId: user.id,
      courts: {
        create: Array.from({ length: validatedData.courtCount }).map((_, i) => ({
          name: `Terrain ${i + 1}`,
        })),
      },
    },
  });

  revalidatePath("/leagues");
  redirect("/leagues");
}

export async function updateLeague(leagueId: string, formData: FormData) {
  const user = await ensureLeagueManager(leagueId);

  const rawData = {
    name: formData.get("name"),
    description: formData.get("description"),
    maxPlayers: formData.get("maxPlayers"),
    levelMin: formData.get("levelMin"),
    levelMax: formData.get("levelMax"),
    courtCount: 1, // Non utilisé ici mais requis par le schéma
    defaultStartTime: formData.get("defaultStartTime"),
    defaultDuration: formData.get("defaultDuration"),
    defaultLocation: formData.get("defaultLocation"),
  };

  const validatedData = leagueSchema.partial().parse(rawData);

  await prisma.league.update({
    where: { id: leagueId, managerId: user.id },
    data: {
      name: validatedData.name,
      description: validatedData.description,
      settings: {
        maxPlayers: validatedData.maxPlayers,
        levelMin: validatedData.levelMin,
        levelMax: validatedData.levelMax,
        defaultStartTime: validatedData.defaultStartTime,
        defaultDuration: validatedData.defaultDuration,
        defaultLocation: validatedData.defaultLocation,
      }
    }
  });

  revalidatePath(`/leagues/${leagueId}/settings`);
  revalidatePath(`/leagues/${leagueId}`);
}
