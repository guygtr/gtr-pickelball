"use server";

import { createClient } from "@/utils/supabase/server";
import { prisma } from "@/lib/prisma";
import { leagueSchema } from "@/lib/validations/league";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createLeague(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Vous devez être connecté pour créer une ligue.");
  }

  const rawData = {
    name: formData.get("name"),
    description: formData.get("description"),
    maxPlayers: formData.get("maxPlayers"),
    levelMin: formData.get("levelMin"),
    levelMax: formData.get("levelMax"),
  };

  const validatedData = leagueSchema.parse(rawData);

  const league = await prisma.league.create({
    data: {
      name: validatedData.name,
      description: validatedData.description,
      settings: {
        maxPlayers: validatedData.maxPlayers,
        levelMin: validatedData.levelMin || 2.0,
        levelMax: validatedData.levelMax || 5.0,
      },
      managerId: user.id,
    },
  });

  revalidatePath("/leagues");
  redirect("/leagues");
}
