import { prisma } from "@/lib/prisma";
import { ensureLeagueManager } from "@/lib/auth-utils";
import { GlassCard } from "@/components/ui/gtr/glass-card";
import {
  Users,
  Calendar,
  Trophy,
  TrendingUp,
  MapPin,
  ChevronRight,
  Play,
} from "lucide-react";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import Link from "next/link";
import { MatchDataSchema } from "@/lib/session-utils";
import { LeagueOnboarding } from "@/components/leagues/league-onboarding";

/**
 * Dashboard ligue — Option B : ton outil, prochaines sessions en avant.
 */
export default async function LeagueDashboard({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;

  try {
    await ensureLeagueManager(resolvedParams.id);
  } catch {
    notFound();
  }

  const league = await prisma.league.findUnique({
    where: { id: resolvedParams.id },
    include: {
      _count: {
        select: {
          players: true,
          sessions: true,
          courts: true,
        },
      },
      players: {
        orderBy: { firstName: "asc" },
        take: 12,
      },
      sessions: {
        where: {
          date: { gte: new Date(Date.now() - 12 * 60 * 60 * 1000) },
        },
        take: 4,
        orderBy: { date: "asc" },
        include: {
          _count: {
            select: { attendances: true },
          },
        },
      },
    },
  });

  if (!league) {
    notFound();
  }

  const matches = await prisma.match.findMany({
    where: {
      session: {
        leagueId: league.id,
      },
    },
    select: {
      data: true,
    },
  });

  const matchCount = matches.filter((m) => {
    const d = m.data as MatchDataSchema | null;
    return d && d.winner !== undefined && d.winner !== null;
  }).length;

  const skillAgg = await prisma.player.aggregate({
    where: { leagueId: league.id },
    _avg: { skillLevel: true },
    _count: true,
  });

  const playerCountForAvg = skillAgg._count;
  const avgLevel =
    skillAgg._avg.skillLevel != null
      ? skillAgg._avg.skillLevel.toFixed(1)
      : "0.0";

  const stats = [
    {
      label: "Joueurs",
      value: league._count.players,
      icon: Users,
      color: "text-pickle-secondary",
    },
    {
      label: "Sessions",
      value: league._count.sessions,
      icon: Calendar,
      color: "text-pickle-primary",
    },
    {
      label: "Matchs joués",
      value: matchCount,
      icon: Trophy,
      color: "text-pickle-muted",
    },
    {
      label: "Niveau moyen",
      value: avgLevel,
      icon: TrendingUp,
      color: "text-pickle-tertiary",
    },
  ];

  const nextSession = league.sessions[0];

  return (
    <div className="space-y-8">
      <LeagueOnboarding
        leagueId={resolvedParams.id}
        playerCount={league._count.players}
        courtCount={league._count.courts}
        sessionCount={league._count.sessions}
      />

      {/* CTA jour de match */}
      {nextSession && (
        <Link
          href={`/leagues/${resolvedParams.id}/sessions/${nextSession.id}`}
          className="block group"
        >
          <GlassCard className="p-5 md:p-6 border-pickle-primary/25 bg-pickle-primary/[0.04] hover:border-pickle-primary/40 transition-colors">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-pickle-primary/15 border border-pickle-primary/25 flex items-center justify-center shrink-0">
                  <Play className="w-5 h-5 text-pickle-primary" />
                </div>
                <div>
                  <p className="text-xs font-medium text-pickle-primary mb-1">
                    Prochaine session
                  </p>
                  <p className="text-lg font-semibold text-white capitalize">
                    {format(new Date(nextSession.date), "EEEE d MMMM · HH'h'mm", {
                      locale: fr,
                    })}
                  </p>
                  <p className="text-sm text-slate-500 flex items-center gap-1.5 mt-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {nextSession.location || "Lieu non défini"}
                    <span className="text-slate-600">·</span>
                    <Users className="w-3.5 h-3.5" />
                    {nextSession._count.attendances}/{nextSession.maxPlayers}
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-pickle-primary text-black text-sm font-semibold group-hover:bg-[#cbfb10] transition-colors">
                Ouvrir le jour de match
                <ChevronRight className="w-4 h-4" />
              </span>
            </div>
          </GlassCard>
        </Link>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {stats.map((stat) => (
          <GlassCard
            key={stat.label}
            className="p-4 md:p-5"
            hoverEffect={false}
          >
            <div className="flex flex-col gap-2">
              <span className="text-xs font-medium text-slate-500">
                {stat.label}
              </span>
              <div className="flex items-end justify-between">
                <h3 className="text-2xl md:text-3xl font-semibold text-white tracking-tight leading-none">
                  {stat.value}
                </h3>
                <stat.icon className={`w-5 h-5 ${stat.color} opacity-50`} />
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard className="p-6" hoverEffect={false}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-pickle-primary" />
                Joueurs
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Aperçu de l&apos;effectif
              </p>
            </div>
            <Link
              href={`/leagues/${resolvedParams.id}/players`}
              className="text-xs font-medium text-slate-400 hover:text-white transition-colors"
            >
              Tout voir →
            </Link>
          </div>
          <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1 custom-scrollbar">
            {league.players.length > 0 ? (
              league.players.map(
                (player: {
                  id: string;
                  firstName: string;
                  lastName: string;
                  email: string | null;
                  skillLevel: number;
                }) => (
                  <div
                    key={player.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] border border-white/5"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white text-xs font-semibold shrink-0">
                        {player.firstName[0]}
                        {player.lastName[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="text-white text-sm font-medium truncate">
                          {player.firstName} {player.lastName}
                        </p>
                        <p className="text-slate-500 text-xs truncate">
                          {player.email || "—"}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-medium text-pickle-primary tabular-nums shrink-0 ml-2">
                      {player.skillLevel.toFixed(1)}
                    </span>
                  </div>
                )
              )
            ) : (
              <div className="text-center py-10 space-y-2">
                <p className="text-slate-400 text-sm">Aucun joueur</p>
                <Link
                  href={`/leagues/${resolvedParams.id}/players`}
                  className="text-sm text-pickle-primary hover:underline"
                >
                  Ajouter des joueurs
                </Link>
              </div>
            )}
            {playerCountForAvg > league.players.length && (
              <p className="text-center text-xs text-slate-600 pt-2">
                +{playerCountForAvg - league.players.length} autres…
              </p>
            )}
          </div>
        </GlassCard>

        <GlassCard className="p-6" hoverEffect={false}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-pickle-secondary" />
                Sessions à venir
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Accès rapide au jour de match
              </p>
            </div>
            <Link
              href={`/leagues/${resolvedParams.id}/sessions`}
              className="text-xs font-medium text-slate-400 hover:text-white transition-colors"
            >
              Toutes →
            </Link>
          </div>
          <div className="space-y-3">
            {league.sessions.length > 0 ? (
              league.sessions.map(
                (session: {
                  id: string;
                  date: Date;
                  location: string | null;
                  maxPlayers: number;
                  _count: { attendances: number };
                }) => (
                  <Link
                    key={session.id}
                    href={`/leagues/${resolvedParams.id}/sessions/${session.id}`}
                    className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/15 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex flex-col items-center justify-center text-slate-300 group-hover:border-pickle-primary/30 group-hover:text-pickle-primary transition-colors">
                        <span className="text-[10px] font-medium leading-none">
                          {format(new Date(session.date), "MMM", {
                            locale: fr,
                          })}
                        </span>
                        <span className="text-base font-semibold leading-none">
                          {format(new Date(session.date), "dd")}
                        </span>
                      </div>
                      <div>
                        <p className="text-white text-sm font-medium capitalize">
                          {format(new Date(session.date), "EEEE HH'h'mm", {
                            locale: fr,
                          })}
                        </p>
                        <p className="text-slate-500 text-xs flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3" />{" "}
                          {session.location || "Lieu non défini"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span className="hidden sm:inline">
                        {session._count.attendances}/{session.maxPlayers}
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-white transition-colors" />
                    </div>
                  </Link>
                )
              )
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
                <div className="p-3 rounded-full bg-white/5 border border-white/10">
                  <Calendar className="w-7 h-7 text-slate-500" />
                </div>
                <div>
                  <p className="text-white text-sm font-medium">
                    Aucune session prévue
                  </p>
                  <p className="text-slate-500 text-xs mt-1">
                    Planifiez une session pour démarrer le jour de match.
                  </p>
                </div>
                <Link
                  href={`/leagues/${resolvedParams.id}/sessions`}
                  className="text-sm font-medium text-pickle-primary hover:underline"
                >
                  Aller aux sessions
                </Link>
              </div>
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
