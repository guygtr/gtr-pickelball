/**
 * Vérifie si une adresse courriel appartient à un administrateur.
 * Utilisable côté client et serveur.
 */
export function isUserAdmin(email?: string) {
  if (!email) return false;

  const adminEmails = (process.env.ADMIN_EMAILS || "").toLowerCase().split(",");

  const lowerEmail = email.toLowerCase();

  return adminEmails.includes(lowerEmail);
}
