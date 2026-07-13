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
          <option value="upcoming_first" className="bg-slate-900 text-slate-200">Actives d&apos;abord (Chronologique)</option>
          <option value="date_desc" className="bg-slate-900 text-slate-200">Plus récentes d&apos;abord</option>
          <option value="date_asc" className="bg-slate-900 text-slate-200">Plus anciennes d&apos;abord</option>
        </select>

        <div className="flex p-1 bg-white/5 border border-white/10 rounded-xl">
          <button
            type="button"
            onClick={() => setView("grid")}
            className={`p-2 rounded-lg transition-colors ${
              view === "grid"
                ? "bg-white/10 text-white"
                : "text-slate-400 hover:text-white"
            }`}
            aria-label="Vue grille"
          >
            <LayoutGrid className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => setView("list")}
            className={`p-2 rounded-lg transition-colors ${
              view === "list"
                ? "bg-white/10 text-white"
                : "text-slate-400 hover:text-white"
            }`}
            aria-label="Vue liste"
          >
            <List className="w-5 h-5" />
          </button>
        </div>
      </div>

      {view === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedSessions.map((session) => {
            const status = getSessionStatus(session as unknown as import("@/lib/session-utils").SessionWithMeta);
            return (
              <Link key={session.id} href={`/leagues/${leagueId}/sessions/${session.id}`}>
                <GlassCard className="p-5 hover:border-white/15 transition-colors group h-full">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-pickle-primary">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div className={`px-2 py-1 rounded-md text-xs font-medium ${status.color}`}>
                      {status.label}
                    </div>
                  </div>

                  <h3 className="text-base font-semibold text-white capitalize">
                    {format(new Date(session.date), "EEEE d MMMM", { locale: fr })}
                  </h3>
                  <p className="text-slate-400 text-sm mt-0.5">
                    {format(new Date(session.date), "HH'h'mm")}
                  </p>

                  <div className="mt-4 space-y-2">
                    <div className="flex items-center gap-2 text-slate-400 text-sm">
                      <MapPin className="w-4 h-4 text-slate-500" />
                      {session.location || "—"}
                    </div>
                    <div className="flex items-center gap-2 text-slate-400 text-sm">
                      <Users className="w-4 h-4 text-slate-500" />
                      Max {session.maxPlayers} joueurs
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-white/5 flex items-center justify-between">
                    <span className="text-sm font-medium text-pickle-primary group-hover:underline">
                      Jour de match
                    </span>
                    <div className="flex items-center gap-2">
                      <SessionActions sessionId={session.id} date={session.date} />
                      <ChevronRight className="w-4 h-4 text-slate-500" />
                    </div>
                  </div>
                </GlassCard>
              </Link>
            );
          })}
        </div>
      ) : (
        <GlassCard className="overflow-hidden p-0" hoverEffect={false}>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-xs font-medium text-slate-500">
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Lieu</th>
                  <th className="px-4 py-3">Joueurs</th>
                  <th className="px-4 py-3">Statut</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {sortedSessions.map((session) => {
                  const status = getSessionStatus(session as unknown as import("@/lib/session-utils").SessionWithMeta);
                  return (
                    <tr key={session.id} className="group hover:bg-white/[0.03] transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex flex-col items-center justify-center text-slate-300">
                            <span className="text-[10px] font-medium leading-none">
                              {format(new Date(session.date), "MMM", { locale: fr })}
                            </span>
                            <span className="text-base font-semibold leading-none">
                              {format(new Date(session.date), "dd")}
                            </span>
                          </div>
                          <div>
                            <div className="text-white text-sm font-medium capitalize">
                              {format(new Date(session.date), "EEEE", { locale: fr })}
                            </div>
                            <div className="text-slate-500 text-xs">
                              {format(new Date(session.date), "HH:mm")}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-sm">
                        {session.location || "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-sm">
                        Max {session.maxPlayers}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-md text-xs font-medium ${status.color}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <SessionActions sessionId={session.id} date={session.date} />
                          <Link
                            href={`/leagues/${leagueId}/sessions/${session.id}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-pickle-primary hover:bg-pickle-primary/10 rounded-lg transition-colors"
                          >
                            Ouvrir
                            <ChevronRight className="w-3.5 h-3.5" />
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
        <div className="py-16 text-center">
          <div className="w-14 h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-7 h-7 text-slate-600" />
          </div>
          <h3 className="text-lg font-semibold text-white">Aucune session planifiée</h3>
          <p className="text-slate-500 mt-2 max-w-sm mx-auto text-sm">
            Planifiez une session pour ouvrir le jour de match sur le terrain.
          </p>
        </div>
      )}
    </div>
  );
}
