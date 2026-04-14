"use server";

/**
 * Module de rate limiting en mémoire pour les Server Actions.
 * Protège les actions d'authentification contre les attaques par force brute.
 * 
 * @module rate-limit
 */

interface RateLimitEntry {
  count: number;
  firstAttempt: number;
  blockedUntil?: number;
}

// Store en mémoire — fonctionnel pour les déploiements single-instance (Vercel)
const store = new Map<string, RateLimitEntry>();

// Nettoyage automatique toutes les 5 minutes pour éviter les fuites mémoire
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
      if (now - entry.firstAttempt > 10 * 60 * 1000) {
        store.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}

export interface RateLimitResult {
  success: boolean;
  remainingAttempts?: number;
  retryAfterSeconds?: number;
}

/**
 * Vérifie si une clé a dépassé la limite de tentatives autorisées.
 * @param identifier Clé unique (ex: email ou IP)
 * @param maxAttempts Nombre maximum de tentatives dans la fenêtre
 * @param windowMs Fenêtre de temps en millisecondes (défaut: 15min)
 * @param blockMs Durée de blocage après dépassement (défaut: 15min)
 */
export function checkRateLimit(
  identifier: string,
  maxAttempts: number = 5,
  windowMs: number = 15 * 60 * 1000,
  blockMs: number = 15 * 60 * 1000
): RateLimitResult {
  const now = Date.now();
  const entry = store.get(identifier);

  // Vérifier si l'identifiant est bloqué
  if (entry?.blockedUntil && now < entry.blockedUntil) {
    return {
      success: false,
      retryAfterSeconds: Math.ceil((entry.blockedUntil - now) / 1000),
    };
  }

  // Réinitialiser si la fenêtre est expirée
  if (!entry || now - entry.firstAttempt > windowMs) {
    store.set(identifier, { count: 1, firstAttempt: now });
    return { success: true, remainingAttempts: maxAttempts - 1 };
  }

  entry.count++;

  // Bloquer si la limite est dépassée
  if (entry.count > maxAttempts) {
    entry.blockedUntil = now + blockMs;
    store.set(identifier, entry);
    return {
      success: false,
      retryAfterSeconds: Math.ceil(blockMs / 1000),
    };
  }

  store.set(identifier, entry);
  return {
    success: true,
    remainingAttempts: maxAttempts - entry.count,
  };
}

/**
 * Réinitialise le compteur pour un identifiant donné (après connexion réussie).
 */
export function resetRateLimit(identifier: string): void {
  store.delete(identifier);
}
