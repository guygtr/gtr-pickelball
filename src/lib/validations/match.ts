import { z } from "zod";

export const matchResultSchema = z.object({
  winner: z.number().min(0).max(2).describe("0: Nul, 1: Équipe 1, 2: Équipe 2"),
});

export const matchIdSchema = z.string().cuid();
export const sessionIdSchema = z.string().cuid();
export const playerIdSchema = z.string().cuid();

export const toggleAttendanceSchema = z.object({
  sessionId: sessionIdSchema,
  playerId: playerIdSchema,
  isPresent: z.boolean(),
});

export const toggleRoundStatusSchema = z.object({
  sessionId: sessionIdSchema,
  roundIdx: z.number().min(0),
  isClosed: z.boolean(),
});
