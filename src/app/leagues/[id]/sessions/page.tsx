import { prisma } from "@/lib/prisma";
import { GlassCard } from "@/components/ui/gtr/glass-card";
import { Calendar, MapPin, Users, ChevronRight } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { SessionListClient } from "@/components/sessions/session-list-client";

export default async function SessionsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const sessions = await prisma.session.findMany({
    where: { leagueId: resolvedParams.id },
    orderBy: { date: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Calendar className="w-6 h-6 text-pickle-blue" />
          Sessions de Jeu
        </h2>
        <SessionListClient leagueId={resolvedParams.id} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sessions.map((session: { id: string; date: Date; status: string; location: string | null; maxPlayers: number; description: string | null; _count?: { players: number } }) => (
          <Link key={session.id} href={`/leagues/${resolvedParams.id}/sessions/${session.id}`}>
            <GlassCard className="p-6 hover:border-pickle-blue/50 transition-all duration-300 group">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 rounded-xl bg-pickle-blue/10 border border-pickle-blue/20 text-pickle-blue group-hover:bg-pickle-blue group-hover:text-pickle-dark transition-colors duration-300">
                  <Calendar className="w-6 h-6" />
                </div>
                <div className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                  session.status === "PLANNED" ? "bg-pickle-blue/10 text-pickle-blue" :
                  session.status === "IN_PROGRESS" ? "bg-pickle-green/10 text-pickle-green" :
                  "bg-slate-500/10 text-slate-400"
                }`}>
                  {session.status}
                </div>
              </div>

              <h3 className="text-lg font-bold text-white capitalize">
                {format(new Date(session.date), "EEEE d MMMM", { locale: fr })}
              </h3>
              <p className="text-pickle-blue text-sm font-medium mt-1">
                {format(new Date(session.date), "HH'h'mm")}
              </p>

              <div className="mt-6 space-y-3">
                <div className="flex items-center gap-2 text-slate-400 text-sm">
                  <MapPin className="w-4 h-4 text-slate-500" />
                  {session.location}
                </div>
                <div className="flex items-center gap-2 text-slate-400 text-sm">
                  <Users className="w-4 h-4 text-slate-500" />
                  Max {session.maxPlayers} joueurs
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-between group-hover:text-white transition-colors">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-widest">Voir détails</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </GlassCard>
          </Link>
        ))}

        {sessions.length === 0 && (
          <div className="col-span-full py-20 text-center">
            <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Calendar className="w-10 h-10 text-slate-600" />
            </div>
            <h3 className="text-xl font-bold text-white">Aucune session planifiée</h3>
            <p className="text-slate-500 mt-2 max-w-sm mx-auto">
              Planifiez votre première session pour commencer à inviter des joueurs et organiser des matchs.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
