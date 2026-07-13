/**
 * Rate limiting en mémoire (par instance serveur).
 * - Login: checkRateLimit(key, 5, 15min) → { success, retryAfterSeconds }
 * - IA: assertAiRateLimit(userId, action) → { ok, error? }
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export type RateLimitOk = {
  success: true;
  allowed: true;
  remaining: number;
};

export type RateLimitBlocked = {
  success: false;
  allowed: false;
  retryAfterSec: number;
  retryAfterSeconds: number;
};

export type RateLimitResult = RateLimitOk | RateLimitBlocked;

/**
 * Vérifie / consomme un jeton de rate limit.
 */
export function checkRateLimit(
  key: string,
  limit = 10,
  windowMs = 60_000
): RateLimitResult {
  const now = Date.now();
  const current = buckets.get(key);

  if (!current || now >= current.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { success: true, allowed: true, remaining: limit - 1 };
  }

  if (current.count >= limit) {
    const retryAfterSec = Math.max(1, Math.ceil((current.resetAt - now) / 1000));
    return {
      success: false,
      allowed: false,
      retryAfterSec,
      retryAfterSeconds: retryAfterSec,
    };
  }

  current.count += 1;
  return {
    success: true,
    allowed: true,
    remaining: limit - current.count,
  };
}

export function rateLimitMessage(retryAfterSec: number): string {
  return `Trop de requêtes. Réessayez dans ${retryAfterSec}s.`;
}

/**
 * Réinitialise le bucket pour une clé (ex. après login réussi).
 */
export function resetRateLimit(key: string): void {
  buckets.delete(key);
}

/**
 * Rate limit IA par utilisateur.
 */
export function assertAiRateLimit(
  userId: string,
  action: string,
  limit = 8
): { ok: true } | { ok: false; error: string } {
  const result = checkRateLimit(`ai:${userId}:${action}`, limit, 60_000);
  if (!result.allowed) {
    return { ok: false, error: rateLimitMessage(result.retryAfterSec) };
  }
  return { ok: true };
}
