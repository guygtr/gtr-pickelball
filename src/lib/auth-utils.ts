import { createClient } from "@/utils/supabase/server";
import { prisma } from "@/lib/prisma";

/**
 * Récupère l'utilisateur actuel ou lève une erreur s'il n'est pas connecté.
 */
export async function getEnsuredUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("Action non autorisée : Vous devez être connecté.");
  }

  return user;
}

/**
 * Vérifie si l'utilisateur actuel est le manager de la ligue spécifiée.
 */
export async function ensureLeagueManager(leagueId: string) {
  const user = await getEnsuredUser();

  const league = await prisma.league.findUnique({
    where: { id: leagueId },
    select: { 
      managerId: true,
      coManagers: {
        where: { managerId: user.id },
        select: { managerId: true }
      }
    }
  });

  if (!league) {
    throw new Error("Ligue non trouvée.");
  }

  const isOwner = league.managerId === user.id;
  const isCoManager = league.coManagers.length > 0;

  if (!isOwner && !isCoManager) {
    throw new Error("Action non autorisée : Vous n'avez pas l'accès gestionnaire pour cette ligue.");
  }

  return user;
}

/**
 * Vérifie si l'utilisateur actuel est le manager de la ligue associée à une session.
 */
export async function ensureSessionManager(sessionId: string) {
    const session = await prisma.session.findUnique({
        where: { id: sessionId },
        select: { league: { select: { managerId: true, id: true } } }
    });

    if (!session) throw new Error("Session non trouvée.");
    
    return await ensureLeagueManager(session.league.id);
}

/**
 * Vérifie si l'utilisateur actuel est le manager de la ligue associée à un match.
 */
export async function ensureMatchManager(matchId: string) {
    const match = await prisma.match.findUnique({
        where: { id: matchId },
        select: { session: { select: { league: { select: { id: true } } } } }
    });

    if (!match) throw new Error("Match non trouvé.");
    
    return await ensureLeagueManager(match.session.league.id);
}

/**
 * Vérifie si le profil Manager existe dans Prisma et le crée si nécessaire.
 * Retourne l'utilisateur Supabase.
 */
export async function ensurePrismaManager() {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
        throw new Error("Action non autorisée : Vous devez être connecté.");
    }

    // Synchronisation Just-in-Time : S'assurer que l'utilisateur existe dans pb_managers
    await prisma.manager.upsert({
        where: { id: user.id },
        update: {
            email: user.email!,
            name: user.user_metadata?.full_name || user.email?.split("@")[0],
        },
        create: {
            id: user.id,
            email: user.email!,
            name: user.user_metadata?.full_name || user.email?.split("@")[0],
            role: "manager",
        },
    });

    return user;
}
