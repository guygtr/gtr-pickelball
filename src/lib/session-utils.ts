
export interface MatchDataSchema {
  winner?: number | null;
  status?: string;
  [key: string]: unknown;
}

export type SessionWithMeta = {
  date: Date;
  status: string;
  matches?: { data: MatchDataSchema | null }[];
  _count?: {
    matches: number;
  };
};

/**
 * Détermine le statut d'une session en fonction de l'avancement des matchs.
 */
export function getSessionStatus(session: SessionWithMeta) {
  const matches = session.matches || [];
  const totalMatches = matches.length || (session._count?.matches || 0);

  // S'il n'y a pas de matchs générés, c'est forcément "À venir"
  if (totalMatches === 0) {
    return {
      label: "À venir",
      color: "bg-pickle-primary/10 text-pickle-primary",
    };
  }

  // Calculer le nombre de matchs ayant un résultat (winner défini dans data)
  const finishedMatches = matches.filter(m => {
    const data = m.data as MatchDataSchema | null;
    return data && (data.winner !== undefined && data.winner !== null);
  }).length;

  // 1. Terminé : Si TOUS les matchs ont un résultat
  if (finishedMatches > 0 && finishedMatches === totalMatches) {
    return {
      label: "Terminé",
      color: "bg-slate-500/10 text-slate-400 font-bold",
    };
  }

  // 2. En cours : S'il y a au moins un match terminé (mais pas tous)
  if (finishedMatches > 0) {
    return {
      label: "En cours",
      color: "bg-pickle-secondary/10 text-pickle-secondary font-bold shadow-[0_0_15px_rgba(59,130,246,0.1)]",
    };
  }

  // 3. À venir : Par défaut (aucun match terminé)
  return {
    label: "À venir",
    color: "bg-pickle-primary/10 text-pickle-primary",
  };
}
