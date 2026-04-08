import { z } from "zod";
import { SKILL_LEVELS, DEFAULT_SKILL_LEVEL } from "../constants";

/**
 * Schéma de validation pour un joueur individuel.
 */
export const playerSchema = z.object({
  firstName: z.string().min(2, "Le prénom est trop court"),
  lastName: z.string().min(2, "Le nom est trop court"),
  email: z.string().email("Email invalide").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  skillLevel: z.number().refine(val => SKILL_LEVELS.includes(val), {
    message: "Le niveau de compétence doit être l'une des valeurs prédéfinies."
  }).default(DEFAULT_SKILL_LEVEL),
  type: z.enum(["permanent", "remplacant"]).default("permanent"),
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
    skillLevel: z.number().optional().default(DEFAULT_SKILL_LEVEL),
    type: z.enum(["permanent", "remplacant"]).optional().default("permanent"),
  })
);

export type PlayerInput = z.infer<typeof playerSchema>;
export type PlayerImportInput = z.infer<typeof playerImportSchema>;
