import { prisma } from "@/lib/prisma";
import { GlassCard } from "@/components/ui/gtr/glass-card";
import { Users, Calendar, Trophy, TrendingUp } from "lucide-react";
import { notFound } from "next/navigation";

export default async function LeagueDashboard({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const league = await prisma.league.findUnique({
    where: { id: resolvedParams.id },
    include: {
      _count: {
        select: {
          players: true,
          sessions: true,
        },
      },
      players: {
        orderBy: { firstName: "asc" },
      },
      sessions: {
        where: {
          date: { gte: new Date() }
        },
        take: 3,
        orderBy: { date: "asc" },
        include: {
          _count: {
            select: { attendances: true }
          },
          matches: {
            select: { id: true }
          }
        }
      }
    },
  });

  if (!league) {
    notFound();
  }

  const stats = [
    { label: "Joueurs", value: league._count.players, icon: Users, color: "text-blue-400" },
    { label: "Sessions", value: league._count.sessions, icon: Calendar, color: "text-emerald-400" },
    { label: "Matchs Joués", value: 0, icon: Trophy, color: "text-amber-400" }, // TODO: Compter les matchs
    { label: "Niveau Moyen", value: "3.2", icon: TrendingUp, color: "text-purple-400" }, // TODO: Calculer
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat) => (
        <GlassCard key={stat.label} className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm font-medium">{stat.label}</p>
              <h3 className="text-3xl font-bold text-white mt-1">{stat.value}</h3>
            </div>
            <div className={`p-3 rounded-xl bg-white/5 ${stat.color}`}>
              <stat.icon className="w-6 h-6" />
            </div>
          </div>
        </GlassCard>
      ))}

      {/* Liste des Joueurs */}
      <GlassCard className="md:col-span-2 p-6">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-400" />
            Liste des Joueurs
          </div>
          <span className="text-xs text-slate-500 font-normal">{league.players.length} joueurs</span>
        </h3>
        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
          {league.players.length > 0 ? (
            league.players.map((player: any) => (
              <div key={player.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-blue-500 flex items-center justify-center text-white font-bold text-sm">
                    {player.firstName[0]}{player.lastName[0]}
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm">{player.firstName} {player.lastName}</p>
                    <p className="text-slate-500 text-xs">{player.email || "Pas d'email"}</p>
                  </div>
                </div>
                <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
                  {player.skillLevel.toFixed(1)}
                </div>
              </div>
            ))
          ) : (
            <p className="text-slate-500 text-center py-8">Aucun joueur pour le moment.</p>
          )}
        </div>
      </GlassCard>

      {/* Prochaines Sessions */}
      <GlassCard className="md:col-span-2 p-6">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-400" />
          Prochaines Sessions
        </h3>
        <div className="space-y-4">
          {league.sessions.length > 0 ? (
            league.sessions.map((session: any) => (
              <Link 
                key={session.id} 
                href={`/leagues/${resolvedParams.id}/sessions/${session.id}`}
                className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:border-blue-500/30 transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex flex-col items-center justify-center text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-all">
                    <span className="text-[10px] font-bold uppercase leading-none">{format(new Date(session.date), "MMM", { locale: fr })}</span>
                    <span className="text-lg font-bold leading-none">{format(new Date(session.date), "dd")}</span>
                  </div>
                  <div>
                    <p className="text-white font-semibold capitalize">{format(new Date(session.date), "EEEE HH'h'mm", { locale: fr })}</p>
                    <p className="text-slate-500 text-xs flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3" /> {session.location || "Lieu non défini"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs font-medium">
                  <div className="text-slate-400 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    {session._count.attendances} / {session.maxPlayers}
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-white transition-colors" />
                </div>
              </Link>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-4 opacity-60">
              <div className="p-4 rounded-full bg-blue-500/10 border border-blue-500/20">
                <Calendar className="w-8 h-8 text-blue-400" />
              </div>
              <div>
                <p className="text-white font-medium">Aucune session prévue</p>
                <p className="text-slate-500 text-sm mt-1">Créez votre première session pour commencer à jouer.</p>
              </div>
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  );
}

import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ChevronRight, MapPin } from "lucide-react";
import Link from "next/link";
