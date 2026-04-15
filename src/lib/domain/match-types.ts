/**
 * GTR-Pickleball — Types de données pour les matchs
 * Standard Architectural GTR-Team 2026
 */

/**
 * Interface pour les données JSON d'un match telles que stockées dans le champ 'data' de Prisma.
 */
export interface MatchData {
  status: "UPCOMING" | "LIVE" | "COMPLETED";
  team1: string[]; // Liste des IDs de joueurs
  team2: string[]; // Liste des IDs de joueurs
  score1: number;
  score2: number;
  type: "SINGLES" | "DOUBLES";
  winner?: number; // 1 pour team1, 2 pour team2, 0 pour nul (optionnel)
}
