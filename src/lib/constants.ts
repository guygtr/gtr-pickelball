
/**
 * Niveaux de compétence officiels pour le matchmaking GTR-Pickleball.
 * Échelle granulaire demandée pour un équilibrage précis des équipes.
 */
export const SKILL_LEVELS = [
  1.0, 1.3, 1.5, 1.8, 
  2.0, 2.3, 2.5, 2.8, 
  3.0, 3.3, 3.5, 3.8, 
  4.0, 4.3, 4.5, 4.8, 
  5.0
];

export const DEFAULT_SKILL_LEVEL = 3.0;

/**
 * Retourne le niveau de compétence le plus proche parmi les niveaux prédéfinis.
 * Utile pour l'importation de données externes.
 */
export function getNearestSkillLevel(level: number): number {
  return SKILL_LEVELS.reduce((prev, curr) => 
    Math.abs(curr - level) < Math.abs(prev - level) ? curr : prev
  );
}
