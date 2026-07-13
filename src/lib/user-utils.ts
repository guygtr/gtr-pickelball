/**
 * Vérifie si une adresse courriel appartient à un administrateur.
 * Fail-closed : si ADMIN_EMAILS est absent/vide → personne n'est admin.
 */

export function isUserAdmin(email?: string | null): boolean {
  if (!email) return false;

  const raw = process.env.ADMIN_EMAILS?.trim();
  if (!raw) {
    // Fail-closed
    return false;
  }

  const adminEmails = raw
    .toLowerCase()
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);

  if (adminEmails.length === 0) return false;

  return adminEmails.includes(email.toLowerCase());
}
