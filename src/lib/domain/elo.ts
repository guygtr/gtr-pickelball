/**
 * GTR-Pickleball — Moteur GTR Smart-ELO
 * Standard Architectural GTR-Team 2026
 * 
 * Cet algorithme calcule l'évolution du niveau IA basé sur les résultats de match
 * (victoire/défaite) sans nécessiter les scores de points.
 */

export interface EloResult {
  newAiLevel: number;
  confidenceIncrement: number;
  expectedOutcome: number; // Probabilité de victoire (0 à 1)
}

/**
 * Calcule le nouveau niveau IA pour un joueur après un match.
 * 
 * @param currentAiLevel Niveau IA actuel du joueur.
 * @param manualLevel Niveau manuel (utilisé comme base si pas d'IA).
 * @param teamAvgLevel Niveau moyen de l'équipe du joueur (pour le calcul de synergie).
 * @param opponentAvgLevel Niveau moyen de l'équipe adverse.
 * @param won Si le joueur a gagné ou non.
 * @param matchesPlayed Nombre de matchs déjà analysés pour ce joueur (pour le facteur K).
 * @returns Le nouveau niveau calculé et les métadonnées associées.
 */
export function calculateGtrElo(
  currentAiLevel: number | null,
  manualLevel: number,
  teamAvgLevel: number,
  opponentAvgLevel: number,
  won: boolean,
  matchesPlayed: number = 0
): EloResult {
  // 1. Initialisation (Fallback sur le niveau manuel si pas encore d'IA)
  const baseLevel = currentAiLevel ?? manualLevel;

  // 2. Facteur de Sensibilité (K-Factor)
  // On est plus volatil pour les nouveaux joueurs (K plus élevé).
  // On stabilise après ~20 matchs.
  const K_MAX = 0.20; // Saut maximal par match pour un nouveau
  const K_MIN = 0.05; // Saut minimal pour un vétéran
  const K = matchesPlayed < 20 
    ? K_MAX - (matchesPlayed * (K_MAX - K_MIN) / 20)
    : K_MIN;

  // 3. Calcul de la Probabilité de Victoire (Expected Outcome)
  // Basé sur l'échelle de Pickleball (1.0 à 5.0).
  // On utilise un diviseur de 2.0 pour que l'écart de 0.5 niveau soit significatif.
  const exponent = (opponentAvgLevel - teamAvgLevel) / 2.0;
  const expectedOutcome = 1 / (1 + Math.pow(10, exponent));

  // 4. Observation du résultat
  const observation = won ? 1 : 0;

  // 5. Calcul de l'évolution
  // La variation dépend de la surprise (Observation - Attente)
  const delta = K * (observation - expectedOutcome);
  
  // Nouveau niveau (clamped entre 1.0 et 5.5 pour éviter les dérives extrêmes)
  let newAiLevel = baseLevel + delta;
  newAiLevel = Math.max(1.0, Math.min(5.5, newAiLevel));

  return {
    newAiLevel: parseFloat(newAiLevel.toFixed(3)),
    confidenceIncrement: 1,
    expectedOutcome
  };
}

/**
 * Calcule l'impact d'une session complète sur un joueur.
 * @param results Liste des résultats { won: boolean, opponentAvg: number, teamAvg: number }
 */
export function computeSessionImpact(
  currentAi: number | null,
  manualBase: number,
  matches: { won: boolean, opponentAvg: number, teamAvg: number }[],
  initialMatchesPlayed: number = 0
): number {
  let tempLevel = currentAi ?? manualBase;
  let count = initialMatchesPlayed;

  matches.forEach(m => {
    const result = calculateGtrElo(tempLevel, manualBase, m.teamAvg, m.opponentAvg, m.won, count);
    tempLevel = result.newAiLevel;
    count++;
  });

  return parseFloat(tempLevel.toFixed(3));
}
