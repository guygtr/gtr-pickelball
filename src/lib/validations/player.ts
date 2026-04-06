import { z } from "zod";

/**
 * Schéma de validation pour un joueur individuel.
 */
export const playerSchema = z.object({
  firstName: z.string().min(2, "Le prénom est trop court"),
  lastName: z.string().min(2, "Le nom est trop court"),
  email: z.string().email("Email invalide").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  skillLevel: z.number().min(1).max(6).default(2.0),
  leagueId: z.string().cuid(),
});

/**
 * Schéma pour l'import CSV (tableau d'objets partiels).
 */
export const playerImportSchema = z.array(
  z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    email: z.string().email().optional().or(z.literal("")),
    phone: z.string().optional().or(z.literal("")),
    skillLevel: z.number().optional().default(2.0),
  })
);

export type PlayerInput = z.infer<typeof playerSchema>;
export type PlayerImportInput = z.infer<typeof playerImportSchema>;
