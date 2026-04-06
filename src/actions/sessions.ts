"use server";

import { prisma } from "@/lib/prisma";
import { sessionSchema } from "@/lib/validations/session";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export async function createSession(data: z.infer<typeof sessionSchema>) {
  try {
    const validated = sessionSchema.parse(data);
    
    const session = await prisma.session.create({
      data: {
        leagueId: validated.leagueId,
        date: new Date(validated.date),
        location: validated.location || null,
        maxPlayers: validated.maxPlayers,
        duration: validated.duration || null,
        description: validated.description || null,
        status: "PLANNED",
      },
    });

    revalidatePath(`/leagues/${validated.leagueId}/sessions`);
    return { success: true, session };
  } catch (error) {
    console.error("Error creating session:", error);
    return { success: false, error: "Erreur lors de la création de la session" };
  }
}

export async function getSessions(leagueId: string) {
  return await prisma.session.findMany({
    where: { leagueId },
    orderBy: { date: "desc" },
  });
}
