"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { ensureLeagueManager } from "@/lib/auth-utils";
import OpenAI from "openai";
import { logError } from "@/lib/logger";

// Configuration du client xAI (Grok)
const grok = new OpenAI({
  apiKey: process.env.GROK_API_KEY,
  baseURL: "https://api.x.ai/v1",
});

/**
 * Génère un résumé narratif de la session via Grok IA.
 */
export async function generateSmartRecap(sessionId: string) {
  try {
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        league: true,
        matches: true, // On récupère tous les matchs et on filtre en JS pour plus de robustesse sur le JSON
        attendances: {
          where: { isPresent: true },
          include: { player: true }
        }
      }
    });

    if (!session) return { success: false, error: "Session non trouvée" };
    await ensureLeagueManager(session.leagueId);

    if (session.matches.length === 0) {
      return { success: false, error: "Pas assez de matchs terminés pour générer un résumé." };
    }

    // 1. Préparation des données pour le prompt
    const playersMap = new Map(session.attendances.map(a => [a.player.id, `${a.player.firstName} ${a.player.lastName}`]));
    
    // Filtrage JS robuste pour s'assurer que seuls les matchs terminés sont traités
    const matches = session.matches
      .map(m => m.data as any)
      .filter(m => m && m.status === "COMPLETED");

    const processedMatches = matches.map((d, index) => {
      const t1 = d.team1.map((id: string) => playersMap.get(id) || "Inconnu").join(" & ");
      const t2 = d.team2.map((id: string) => playersMap.get(id) || "Inconnu").join(" & ");
      const winner = d.winner === 1 ? t1 : d.winner === 2 ? t2 : "Égalité";
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

    // 3. Sauvegarder dans les settings de la session
    const currentSettings = (session.settings as Record<string, any>) || {};
    await prisma.session.update({
      where: { id: sessionId },
      data: {
        settings: {
          ...currentSettings,
          aiRecap: recapText,
          recapGeneratedAt: new Date().toISOString()
        }
      }
    });

    revalidatePath(`/leagues/${session.leagueId}/sessions/${sessionId}`);
    return { success: true, recap: recapText };
  } catch (error) {
    logError("generateSmartRecap", error);
    return { success: false, error: "L'IA de narration a rencontré un filet." };
  }
}
