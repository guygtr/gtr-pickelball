/**
 * Logger centralisé pour les Server Actions GTR-Pickleball.
 * En production, ne journalise que le message d'erreur (pas la stack trace).
 * Évite la divulgation d'informations sensibles sur la structure interne.
 * 
 * @module logger
 */

const isProd = process.env.NODE_ENV === "production";

/**
 * Journalise une erreur de façon sécurisée.
 * @param context Contexte (nom de l'action, ex: "createLeague")
 * @param error Erreur capturée dans le catch
 */
export function logError(context: string, error: unknown): void {
  const message = error instanceof Error ? error.message : String(error);

  if (isProd) {
    // En production : message seulement, pas de stack trace ni d'objet Prisma
    console.error(`[GTR-ERROR] ${context}: ${message}`);
  } else {
    // En développement : l'erreur complète pour faciliter le débogage
    console.error(`[GTR-ERROR] ${context}:`, error);
  }
}

/**
 * Journalise un avertissement non-bloquant.
 */
export function logWarn(context: string, message: string): void {
  if (!isProd) {
    console.warn(`[GTR-WARN] ${context}: ${message}`);
  }
}
