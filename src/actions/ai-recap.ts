"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { ensureSessionManager } from "@/lib/auth-utils";
import OpenAI from "openai";
import { logError, publicErrorMessage } from "@/lib/logger";
import { assertAiRateLimit } from "@/lib/rate-limit";
import type { MatchData } from "@/lib/domain/match-types";

function isCompletedMatchData(value: unknown): value is MatchData {
  if (!value || typeof value !== "object") return false;
  const m = value as Record<string, unknown>;
  const status = String(m.status ?? "").toUpperCase();
  return (
    Array.isArray(m.team1) &&
    Array.isArray(m.team2) &&
    status === "COMPLETED"
  );
}

/**
 * Génère un résumé narratif de la session via Grok IA.
 */
export async function generateSmartRecap(sessionId: string) {
  try {
    const user = await ensureSessionManager(sessionId);
    const rl = assertAiRateLimit(user.id, "smartRecap", 5);
    if (!rl.ok) {
      return { success: false, error: rl.error };
    }

    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        league: true,
        matches: true,
        attendances: {
          where: { isPresent: true },
          include: { player: true },
        },
      },
    });

    if (!session) return { success: false, error: "Session non trouvée" };

    if (session.matches.length === 0) {
      return { success: false, error: "Pas assez de matchs terminés pour générer un résumé." };
    }

    if (!process.env.GROK_API_KEY) {
      return { success: false, error: "Clé API GROK_API_KEY manquante." };
    }

    const grok = new OpenAI({
      apiKey: process.env.GROK_API_KEY,
      baseURL: "https://api.x.ai/v1",
    });

    // 1. Préparation des données pour le prompt
    const playersMap = new Map(session.attendances.map(a => [a.player.id, `${a.player.firstName} ${a.player.lastName}`]));
    
    const matches: MatchData[] = [];
    for (const row of session.matches) {
      if (isCompletedMatchData(row.data)) {
        matches.push(row.data);
      }
    }

    const processedMatches = matches.map((d, index) => {
      const t1 = d.team1
        .map((id) => playersMap.get(id) || "Inconnu")
        .join(" & ");
      const t2 = d.team2
        .map((id) => playersMap.get(id) || "Inconnu")
        .join(" & ");
      const winner =
        Number(d.winner) === 1 ? t1 : Number(d.winner) === 2 ? t2 : "Égalité";
      return `Match ${index + 1}: ${t1} VS ${t2} -> Gagnant: ${winner}`;
    });

    const prompt = `
      Tu es l'analyste sportif officiel de la ligue de Pickleball "GTR-Pickleball". 
      Analyse les résultats suivants de la session du ${session.date.toLocaleDateString()} et rédige un "GTR Smart Recap" épique, fun et compétitif.
      
      CONSIGNES:
      - Rédige en Français de qualité (ton dynamique et professionnel).
      - ABSOLUMENT AUCUN JURON ni expression trop familière (ton propre).
      - Mentionne les joueurs performants avec élégance.
      - Maximum 2 paragraphes très concis et percutants.
      - Ajoute une section "Le coup de génie" (1 seule phrase).
      - Ajoute des emojis de Pickleball.
      
      RÉSULTATS DES MATCHS:
      ${processedMatches.join("\n")}
      
      JOUEURS PRÉSENTS:
      ${Array.from(playersMap.values()).join(", ")}
    `;

    // 2. Appel à Grok
    const completion = await grok.chat.completions.create({
      model: "grok-4-1-fast-non-reasoning", // Modèle 2026 optimisé pour le texte narratif
      messages: [
        { role: "system", content: "Tu es un assistant IA expert en Pickleball et en narration sportive." },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
    });

    const recapText = completion.choices[0].message.content;

    const currentSettings =
      session.settings &&
      typeof session.settings === "object" &&
      !Array.isArray(session.settings)
        ? (session.settings as Record<string, unknown>)
        : {};
    await prisma.session.update({
      where: { id: sessionId },
      data: {
        settings: {
          ...currentSettings,
          aiRecap: recapText,
          recapGeneratedAt: new Date().toISOString(),
        },
      },
    });

    revalidatePath(`/leagues/${session.leagueId}/sessions/${sessionId}`);
    return { success: true, recap: recapText };
  } catch (error) {
    logError("generateSmartRecap", error);
    return {
      success: false,
      error: publicErrorMessage(error, "L'IA de narration a rencontré un filet."),
    };
  }
}
