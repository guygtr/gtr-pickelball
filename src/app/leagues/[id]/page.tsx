import { prisma } from "@/lib/prisma";
import { GlassCard } from "@/components/ui/gtr/glass-card";
import { Users, Calendar, Trophy, TrendingUp, MapPin, ChevronRight } from "lucide-react";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import Link from "next/link";
import { MatchDataSchema } from "@/lib/session-utils";

export default async function LeagueDashboard({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  
  // 1. Charger les données de la ligue
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
            select: { data: true }
          }
        }
      }
    },
  });

  if (!league) {
    notFound();
  }

  // 2. Compter le nombre de matchs joués (ayant un résultat)
  const matches = await prisma.match.findMany({
    where: {
      session: {
        leagueId: league.id
      }
    },
    select: {
      data: true
    }
  });

  const matchCount = matches.filter((m) => {
    const d = m.data as MatchDataSchema | null;
    return d && (d.winner !== undefined && d.winner !== null);
  }).length;

  // 3. Préparer les statistiques
  const avgLevel = league.players.length > 0 
    ? (league.players.reduce((acc: number, p: { skillLevel: number }) => acc + p.skillLevel, 0) / league.players.length).toFixed(1)
    : "0.0";

  const stats = [
    { label: "JOUEURS", value: league._count.players, icon: Users, color: "text-pickle-secondary", glow: "glow-blue" },
    { label: "SESSIONS", value: league._count.sessions, icon: Calendar, color: "text-pickle-primary", glow: "glow-accent" },
    { label: "MATCHS JOUÉS", value: matchCount, icon: Trophy, color: "text-pickle-muted", glow: "" },
    { label: "NIVEAU MOYEN", value: avgLevel, icon: TrendingUp, color: "text-pickle-tertiary", glow: "" },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in-up">
      {stats.map((stat) => (
        <GlassCard key={stat.label} className={`p-8 relative overflow-hidden group`}>
          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-black text-slate-500 tracking-[0.3em] uppercase">{stat.label}</span>
            <div className="flex items-end justify-between">
              <h3 className="text-4xl font-black text-white tracking-tighter leading-none">{stat.value}</h3>
              <stat.icon className={`w-6 h-6 ${stat.color} opacity-40 group-hover:opacity-100 transition-opacity`} />
            </div>
          </div>
          <div className={`absolute -bottom-4 -right-4 w-12 h-12 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity ${stat.color === 'text-pickle-secondary' ? 'bg-pickle-secondary' : stat.color === 'text-pickle-primary' ? 'bg-pickle-primary' : 'bg-white'}`} />
        </GlassCard>
      ))}

      {/* Liste des Joueurs */}
      <GlassCard className="md:col-span-2 p-8 animate-fade-in-up [animation-delay:100ms]">
        <div className="flex items-center justify-between mb-8">
          <div className="space-y-1">
            <h3 className="text-2xl font-black text-white tracking-tighter uppercase flex items-center gap-3">
              <Users className="w-6 h-6 text-pickle-primary" />
              JOUEURS
            </h3>
            <p className="text-[10px] font-bold text-slate-500 tracking-[0.2em] uppercase">EFFECTIF DE LA LIGUE</p>
          </div>
          <div className="px-4 py-2 rounded-xl glass border border-white/5 text-xs font-black text-white tracking-widest">
            {league.players.length} TOTAL
          </div>
        </div>
        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
          {league.players.length > 0 ? (
            league.players.map((player: { id: string, firstName: string, lastName: string, email: string | null, skillLevel: number }) => (
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
            league.sessions.map((session: { id: string, date: Date, location: string | null, maxPlayers: number, _count: { attendances: number } }) => (
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

