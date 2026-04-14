"use client";

import { useState } from "react";
import { LayoutGrid, List, Calendar, MapPin, Users, ChevronRight } from "lucide-react";
import { GlassCard } from "@/components/ui/gtr/glass-card";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import Link from "next/link";

import { getSessionStatus } from "@/lib/session-utils";
import { Prisma } from "@prisma/client";
import { SessionActions } from "./session-actions";

interface Session {
  id: string;
  date: Date;
  status: string;
  location: string | null;
  maxPlayers: number;
  description: string | null;
  _count?: {
    matches: number;
  };
  matches?: { data: Prisma.JsonValue | null }[];
}

/**
 * Composant de bascule de vue (Grille/Liste) pour les sessions d'une ligue.
 * @param {Session[]} sessions Liste des sessions à afficher.
 * @param {string} leagueId ID de la ligue parente.
 */
export function SessionsViewToggle({ 
  sessions, 
  leagueId 
}: { 
  sessions: Session[]; 
  leagueId: string;
}) {
  const [view, setView] = useState<"grid" | "list">("grid");
  const [sortOrder, setSortOrder] = useState<"upcoming_first" | "date_desc" | "date_asc">("upcoming_first");

  const sortedSessions = [...sessions].sort((a, b) => {
    if (sortOrder === "date_desc") {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    }
    if (sortOrder === "date_asc") {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    }
    
    // Sort logic for "upcoming_first"
    const statusA = getSessionStatus(a as unknown as import("@/lib/session-utils").SessionWithMeta);
    const statusB = getSessionStatus(b as unknown as import("@/lib/session-utils").SessionWithMeta);
    
    const aIsFinished = statusA.label === "Terminé";
    const bIsFinished = statusB.label === "Terminé";

    // Finished ones go to the bottom
    if (aIsFinished && !bIsFinished) return 1;
    if (!aIsFinished && bIsFinished) return -1;

    // Both are NOT finished: sort ascending (closest incoming first)
    if (!aIsFinished && !bIsFinished) {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    }
    
    // Both ARE finished: sort descending (most recent finished first)
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center sm:justify-end gap-3 flex-wrap">
        <select 
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value as "upcoming_first" | "date_desc" | "date_asc")}
          className="bg-white/5 border border-white/10 text-slate-300 text-xs rounded-xl px-3 py-2 outline-none focus:border-pickle-secondary/50 cursor-pointer"
        >
          <option value="upcoming_first" className="bg-slate-900 text-slate-200">Actives d'abord (Chronologique)</option>
          <option value="date_desc" className="bg-slate-900 text-slate-200">Plus récentes d'abord</option>
          <option value="date_asc" className="bg-slate-900 text-slate-200">Plus anciennes d'abord</option>
        </select>

        <div className="flex p-1 bg-white/5 border border-white/10 rounded-xl disabled">
          <button
            onClick={() => setView("grid")}
            className={`p-2 rounded-lg transition-all ${
              view === "grid" 
                ? "bg-pickle-secondary text-pickle-dark shadow-lg shadow-pickle-secondary/20" 
                : "text-slate-400 hover:text-white"
            }`}
          >
            <LayoutGrid className="w-5 h-5" />
          </button>
          <button
            onClick={() => setView("list")}
            className={`p-2 rounded-lg transition-all ${
              view === "list" 
                ? "bg-pickle-secondary text-pickle-dark shadow-lg shadow-pickle-secondary/20" 
                : "text-slate-400 hover:text-white"
            }`}
          >
            <List className="w-5 h-5" />
          </button>
        </div>
      </div>

      {view === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedSessions.map((session) => {
            const status = getSessionStatus(session as unknown as import("@/lib/session-utils").SessionWithMeta);
            return (
              <Link key={session.id} href={`/leagues/${leagueId}/sessions/${session.id}`}>
                <GlassCard className="p-6 hover:border-pickle-secondary/50 transition-all duration-300 group">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 rounded-xl bg-pickle-secondary/10 border border-pickle-secondary/20 text-pickle-secondary group-hover:bg-pickle-secondary group-hover:text-pickle-dark transition-colors duration-300">
                      <Calendar className="w-6 h-6" />
                    </div>
                    <div className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${status.color}`}>
                      {status.label}
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-white capitalize">
                    {format(new Date(session.date), "EEEE d MMMM", { locale: fr })}
                  </h3>
                  <p className="text-pickle-secondary text-sm font-medium mt-1">
                    {format(new Date(session.date), "HH'h'mm")}
                  </p>

                  <div className="mt-6 space-y-3">
                    <div className="flex items-center gap-2 text-slate-400 text-sm">
                      <MapPin className="w-4 h-4 text-slate-500" />
                      {session.location || "-"}
                    </div>
                    <div className="flex items-center gap-2 text-slate-400 text-sm">
                      <Users className="w-4 h-4 text-slate-500" />
                      Max {session.maxPlayers} joueurs
                    </div>
                  </div>

                  <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-between group-hover:text-white transition-colors relative">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-slate-500 uppercase tracking-widest">Voir détails</span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                    <SessionActions sessionId={session.id} date={session.date} />
                  </div>
                </GlassCard>
              </Link>
            );
          })}
        </div>
      ) : (
        <GlassCard className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Lieu</th>
                  <th className="px-6 py-4">Joueurs</th>
                  <th className="px-6 py-4">Statut</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {sortedSessions.map((session) => {
                  const status = getSessionStatus(session as unknown as import("@/lib/session-utils").SessionWithMeta);
                  return (
                    <tr key={session.id} className="group hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-pickle-secondary/10 border border-pickle-secondary/20 flex flex-col items-center justify-center text-pickle-secondary">
                            <span className="text-[10px] font-bold uppercase leading-none">
                              {format(new Date(session.date), "MMM", { locale: fr })}
                            </span>
                            <span className="text-lg font-bold leading-none">
                              {format(new Date(session.date), "dd")}
                            </span>
                          </div>
                          <div>
                            <div className="text-white font-medium capitalize">
                              {format(new Date(session.date), "EEEE", { locale: fr })}
                            </div>
                            <div className="text-pickle-secondary text-xs">
                              {format(new Date(session.date), "HH:mm")}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-400 text-sm">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-slate-500" />
                          {session.location || "-"}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-400 text-sm">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-slate-500" />
                          Max {session.maxPlayers}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${status.color}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <SessionActions sessionId={session.id} date={session.date} />
                          <Link href={`/leagues/${leagueId}/sessions/${session.id}`}>
                            <button className="p-2 text-slate-500 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-all">
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}

      {sessions.length === 0 && (
        <div className="py-20 text-center">
          <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Calendar className="w-10 h-10 text-slate-600" />
          </div>
          <h3 className="text-xl font-bold text-white">Aucune session planifiée</h3>
          <p className="text-slate-500 mt-2 max-w-sm mx-auto">
            Planifiez votre première session pour commencer à organiser des matchs.
          </p>
        </div>
      )}
    </div>
  );
}
