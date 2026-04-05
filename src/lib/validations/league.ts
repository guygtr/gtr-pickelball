import * as z from "zod";

export const leagueSchema = z.object({
  name: z.string().min(3, "Le nom doit contenir au moins 3 caractères"),
  description: z.string().optional(),
  maxPlayers: z.preprocess((val) => Number(val), z.number().min(2, "Minimum 2 joueurs")),
  levelMin: z.preprocess((val) => val ? Number(val) : undefined, z.number().min(1).max(6).optional()),
  levelMax: z.preprocess((val) => val ? Number(val) : undefined, z.number().min(1).max(6).optional()),
});

export type LeagueSchema = z.infer<typeof leagueSchema>;
