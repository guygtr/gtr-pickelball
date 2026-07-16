/**
 * xAI Grok — configuration canon GTR (Pickelball).
 * Docs: https://docs.x.ai/docs/models
 *
 * Par défaut: grok-4.5 (latest chat + vision).
 * Override env: GROK_MODEL, GROK_BASE_URL
 */

export const GROK_BASE_URL =
  process.env.GROK_BASE_URL?.trim() || "https://api.x.ai/v1";

/** Dernier modèle chat / JSON / narrative recommandé par xAI. */
export const GROK_MODEL =
  process.env.GROK_MODEL?.trim() || "grok-4.5";

export function getGrokApiKey(): string | undefined {
  return process.env.GROK_API_KEY?.trim() || undefined;
}
