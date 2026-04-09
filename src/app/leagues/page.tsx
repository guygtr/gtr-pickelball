import { ensurePrismaManager } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { GlassCard } from "@/components/ui/gtr/glass-card";
import { NeonButton } from "@/components/ui/gtr/neon-button";
import { Trophy, Plus, Users, ArrowRight, Lock, Target } from "lucide-react";

interface LeagueSettings {
  maxPlayers?: number;
}

interface LeagueUI {
  id: string;
  name: string;
  description: string | null;
  settings: LeagueSettings | null;
}

export default async function LeaguesPage() {
    let user;
    try {
        user = await ensurePrismaManager();
    } catch (e) {
        return (
            <main className="min-h-screen pt-24 px-4 flex items-center justify-center">
                <GlassCard className="p-12 text-center max-w-md animate-fade-in-up">
                    <div className="w-16 h-16 bg-pickle-tertiary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Lock className="w-8 h-8 text-pickle-tertiary" />
                    </div>
                    <h2 className="text-3xl font-black text-white mb-4 tracking-tighter uppercase">Accès Restreint</h2>
                    <p className="text-slate-500 mb-8 font-medium">Veuillez vous connecter pour administrer vos ligues et accéder au dashboard.</p>
                    <Link href="/auth/login">
                        <NeonButton variant="blue" className="w-full py-4 tracking-[0.2em]">
                            SE CONNECTER
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
            { coManagers: { some: { managerId: user.id } } }
        ]
    },
    include: {
        coManagers: {
            select: { managerId: true }
        }
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="min-h-screen pt-24 pb-20 px-4">
      <div className="max-w-7xl mx-auto space-y-12 animate-fade-in-up">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-12">
          <div className="space-y-2">
            <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-white uppercase">
              MES <span className="text-gradient">LIGUES</span>
            </h1>
            <p className="text-slate-500 font-medium max-w-md">
              Gérez vos organisations, terrains et tournois avec une précision chirurgicale.
            </p>
          </div>
          <Link href="/leagues/create">
            <NeonButton variant="green" className="px-8 py-4 tracking-[0.2em]">
              <Plus className="w-5 h-5 mr-2" />
              NOUVELLE LIGUE
            </NeonButton>
          </Link>
        </div>

        {leagues.length === 0 ? (
          <GlassCard className="p-20 text-center border-dashed border-white/10 group">
            <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-8 border border-white/5 group-hover:scale-110 transition-transform duration-500">
              <Trophy className="w-10 h-10 text-slate-700" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">Aucune ligue détectée</h3>
            <p className="text-slate-500 mb-10 max-w-sm mx-auto font-medium">
              Vous n&apos;avez pas encore orchestré de ligue. Commencez l&apos;aventure dès maintenant.
            </p>
            <Link href="/leagues/create">
              <NeonButton variant="blue" className="px-10 py-5 tracking-[0.2em]">
                CRÉER MA PREMIÈRE LIGUE
              </NeonButton>
            </Link>
          </GlassCard>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {leagues.map((league) => {
              const isOwner = league.managerId === user.id;
              
              return (
                <Link key={league.id} href={`/leagues/${league.id}`} className="group">
                  <GlassCard className="p-8 h-full flex flex-col hover:border-accent/40 transition-all duration-500 hover:shadow-2xl hover:shadow-accent/5 relative overflow-hidden">
                    {/* Badge de Statut */}
                    <div className={`absolute top-0 right-0 px-4 py-1 text-[9px] font-black tracking-[0.2em] uppercase rounded-bl-xl border-l border-b ${
                        isOwner ? "bg-pickle-primary/10 text-pickle-primary border-pickle-primary/20" : "bg-pickle-secondary/10 text-pickle-secondary border-pickle-secondary/20"
                    }`}>
                        {isOwner ? "PROPRIÉTAIRE" : "CO-GESTION"}
                    </div>

                    <div className="flex justify-between items-start mb-8">
                      <div className="w-14 h-14 bg-accent/10 rounded-2xl flex items-center justify-center group-hover:scale-105 transition-transform">
                        <Target className="w-6 h-6 text-accent" />
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-[10px] font-black text-slate-500 tracking-widest uppercase">
                          Capacité
                        </span>
                        <span className="text-lg font-black text-white">
                          {(league.settings as any)?.maxPlayers || 0} <span className="text-xs text-slate-600">JOUEURS</span>
                        </span>
                      </div>
                    </div>
                    
                    <h3 className="text-2xl font-black text-white mb-3 group-hover:text-accent transition-colors tracking-tighter uppercase leading-tight">
                      {league.name}
                    </h3>
                    
                    <p className="text-slate-500 text-sm font-medium line-clamp-3 mb-8 flex-grow leading-relaxed">
                      {league.description || "Aucune description fournie pour cette organisation premium."}
                    </p>
                    
                    <div className="pt-6 border-t border-white/5 flex items-center justify-between group-hover:text-white transition-colors">
                      <span className="text-[10px] font-bold text-slate-500 tracking-[0.3em] uppercase">Voir détails</span>
                      <ArrowRight className="w-5 h-5 text-accent translate-x-0 group-hover:translate-x-2 transition-transform" />
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
