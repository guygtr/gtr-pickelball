import { isBefore } from "date-fns";

export type SessionWithMeta = {
  date: Date;
  status: string;
  matches?: { id: string }[];
  _count?: {
    matches: number;
  };
};

export function getSessionStatus(session: SessionWithMeta) {
  const now = new Date();
  
  // 1. Terminé si la date est passée
  if (isBefore(session.date, now)) {
    return {
      label: "Terminé",
      color: "bg-slate-500/10 text-slate-400",
    };
  }

  // 2. Prêt si des matchs sont générés (parties cédulées)
  const hasMatches = (session.matches && session.matches.length > 0) || (session._count && session._count.matches > 0);
  if (hasMatches) {
    return {
      label: "Prêt",
      color: "bg-pickle-blue/10 text-pickle-blue",
    };
  }

  // 3. À venir (par défaut)
  return {
    label: "À venir",
    color: "bg-pickle-green/10 text-pickle-green",
  };
}
