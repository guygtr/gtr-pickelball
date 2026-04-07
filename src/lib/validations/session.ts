import * as z from "zod";

export const sessionSchema = z.object({
  leagueId: z.string(),
  date: z.string().or(z.date()),
  location: z.string().optional().or(z.literal("")),
  maxPlayers: z.preprocess((val) => Number(val), z.number().min(2, "Minimum 2 joueurs").default(20)),
  duration: z.preprocess((val) => Number(val), z.number().min(30).max(240).default(120)),
  iterations: z.preprocess((val) => Number(val), z.number().min(1000).max(50000).default(10000)),
  description: z.string().optional().or(z.literal("")),
});

export type SessionSchema = z.infer<typeof sessionSchema>;
