import { ensurePrismaManager } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { GlassCard } from "@/components/ui/gtr/glass-card";
import { NeonButton } from "@/components/ui/gtr/neon-button";
import { Trophy, Plus, ArrowRight, Lock, Target } from "lucide-react";

interface LeagueSettings {
  maxPlayers?: number;
}

/**
 * Liste des ligues — UI outil (P1 : titres sobres, 1 CTA primary).
 */
export default async function LeaguesPage() {
  let user;
  try {
    user = await ensurePrismaManager();
  } catch {
    return (
      <main className="min-h-screen pt-24 px-4 flex items-center justify-center">
        <GlassCard className="p-10 text-center max-w-md" hoverEffect={false}>
          <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-white/10">
            <Lock className="w-7 h-7 text-slate-400" />
          </div>
          <h2 className="text-2xl font-semibold text-white mb-3 tracking-tight">
            Connexion requise
          </h2>
          <p className="text-slate-500 mb-8 text-sm leading-relaxed">
            Connectez-vous pour administrer vos ligues et accéder au tableau de bord.
          </p>
          <Link href="/auth/login">
            <NeonButton variant="primary" className="w-full py-4">
              Se connecter
            </NeonButton>
          </Link>
        </GlassCard>
      </main>
    );
  }

  const leagues = await prisma.league.findMany({
    where: {
      OR: [
        { managerId: user.id },
        { coManagers: { some: { managerId: user.id } } },
      ],
    },
    include: {
      coManagers: {
        select: { managerId: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="min-h-screen pt-24 pb-20 px-4">
      <div className="max-w-7xl mx-auto space-y-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-8">
          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-white">
              Mes ligues
            </h1>
            <p className="text-slate-500 text-sm font-medium max-w-md">
              Organisations, terrains et sessions — en un coup d&apos;œil.
            </p>
          </div>
          <Link href="/leagues/create">
            <NeonButton variant="primary" className="px-6 py-3">
              <Plus className="w-4 h-4 mr-2" />
              Nouvelle ligue
            </NeonButton>
          </Link>
        </div>

        {leagues.length === 0 ? (
          <GlassCard
            className="p-12 md:p-16 text-center border-dashed border-white/10"
            hoverEffect={false}
          >
            <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-white/10">
              <Trophy className="w-8 h-8 text-slate-600" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              Aucune ligue pour l&apos;instant
            </h3>
            <p className="text-slate-500 mb-8 max-w-sm mx-auto text-sm">
              Créez votre première ligue pour commencer à gérer joueurs et sessions.
            </p>
            <Link href="/leagues/create">
              <NeonButton variant="primary" className="px-8 py-3">
                Créer ma première ligue
              </NeonButton>
            </Link>
          </GlassCard>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {leagues.map((league) => {
              const isOwner = league.managerId === user.id;
              const maxPlayers =
                (league.settings as LeagueSettings)?.maxPlayers || 0;

              return (
                <Link
                  key={league.id}
                  href={`/leagues/${league.id}`}
                  className="group"
                >
                  <GlassCard className="p-6 h-full flex flex-col hover:border-white/15 transition-all duration-300 relative overflow-hidden">
                    <div
                      className={`absolute top-3 right-3 px-2.5 py-1 text-[10px] font-semibold rounded-lg border ${
                        isOwner
                          ? "bg-pickle-primary/10 text-pickle-primary border-pickle-primary/20"
                          : "bg-white/5 text-slate-400 border-white/10"
                      }`}
                    >
                      {isOwner ? "Propriétaire" : "Co-gestion"}
                    </div>

                    <div className="flex justify-between items-start mb-6 pr-24">
                      <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center border border-white/10 group-hover:border-pickle-primary/30 transition-colors">
                        <Target className="w-5 h-5 text-pickle-primary" />
                      </div>
                      <div className="flex flex-col items-end gap-0.5">
                        <span className="text-[10px] font-medium text-slate-500">
                          Capacité
                        </span>
                        <span className="text-base font-semibold text-white">
                          {maxPlayers || "—"}{" "}
                          <span className="text-xs text-slate-600 font-normal">
                            joueurs
                          </span>
                        </span>
                      </div>
                    </div>

                    <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-pickle-primary transition-colors leading-snug">
                      {league.name}
                    </h3>

                    <p className="text-slate-500 text-sm line-clamp-3 mb-6 flex-grow leading-relaxed">
                      {league.description || "Pas de description."}
                    </p>

                    <div className="pt-4 border-t border-white/5 flex items-center justify-between text-slate-400 group-hover:text-white transition-colors">
                      <span className="text-xs font-medium">Ouvrir</span>
                      <ArrowRight className="w-4 h-4 text-pickle-primary/80 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </GlassCard>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
