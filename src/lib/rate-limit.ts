/**
 * Rate limiting en mémoire (par instance serveur).
 * - Login: checkRateLimit(key, 5, 15min)
 * - IA: assertAiRateLimit(userId, action)
 *
 * Note multi-instances Vercel : buckets non partagés entre régions/instances.
 * Pour un store partagé, définir RATE_LIMIT_BACKEND=redis + service externe plus tard.
 * En attendant : clé composite user+action + fenêtre courte réduit l'abus.
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
const MAX_BUCKETS = 10_000;

function pruneIfNeeded(now: number) {
  if (buckets.size < MAX_BUCKETS) return;
  for (const [key, b] of buckets) {
    if (now >= b.resetAt) buckets.delete(key);
  }
  // Si encore trop plein, vider les plus anciens naïvement
  if (buckets.size >= MAX_BUCKETS) {
    const keys = [...buckets.keys()].slice(0, Math.floor(MAX_BUCKETS / 2));
    for (const k of keys) buckets.delete(k);
  }
}

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
  pruneIfNeeded(now);
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
