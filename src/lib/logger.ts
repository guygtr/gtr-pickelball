/**
 * Logger centralisé GTR-Pickleball — masque les détails en production.
 */

type LogMeta = Record<string, string | number | boolean | undefined>;

const isProd = process.env.NODE_ENV === "production";

/**
 * Message sûr pour le client (pas de stack Prisma/SQL).
 */
export function publicErrorMessage(
  err: unknown,
  fallback = "Une erreur est survenue."
): string {
  if (!isProd && err instanceof Error && err.message) {
    const msg = err.message;
    if (/password|secret|token|DATABASE|connection|Prisma/i.test(msg)) {
      return fallback;
    }
    return msg.length > 200 ? fallback : msg;
  }
  if (err instanceof Error) {
    // Messages métier explicites (auth, droits) : OK en prod
    if (
      /autoris|connect|ligue|gestionnaire|propriétaire|trouvée|trouvé/i.test(
        err.message
      )
    ) {
      return err.message;
    }
  }
  return fallback;
}

/**
 * Journalise une erreur serveur sans exposer de secrets.
 */
export function logError(
  context: string,
  error: unknown,
  meta?: LogMeta
): void {
  const message = error instanceof Error ? error.message : String(error);
  const payload = {
    level: "error",
    context,
    message: isProd ? message.slice(0, 160) : message,
    ts: new Date().toISOString(),
    ...meta,
    ...(isProd || !(error instanceof Error)
      ? {}
      : { stack: error.stack?.slice(0, 500) }),
  };
  console.error(JSON.stringify(payload));
}

/**
 * Journalise un avertissement non-bloquant (dev).
 */
export function logWarn(context: string, message: string): void {
  if (!isProd) {
    console.warn(JSON.stringify({ level: "warn", context, message }));
  }
}
