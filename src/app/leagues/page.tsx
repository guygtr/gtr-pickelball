import { createClient } from "@/utils/supabase/server";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

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
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="min-h-screen pt-24 px-4 flex items-center justify-center">
        <div className="glass-card p-8 rounded-3xl text-center max-w-md">
          <h2 className="text-2xl font-bold text-white mb-4">Accès Restreint</h2>
          <p className="text-slate-400 mb-6">Veuillez vous connecter pour gérer vos ligues.</p>
          <Link 
            href="/login" 
            className="inline-block bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-3 px-8 rounded-xl transition-all"
          >
            Se connecter
          </Link>
        </div>
      </main>
    );
  }

  const leagues = await prisma.league.findMany({
    where: { managerId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="min-h-screen pt-24 pb-12 px-4 bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950/20">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-bold text-white bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              Mes Ligues
            </h1>
            <p className="text-slate-400">Gérez vos organisations et vos tournois.</p>
          </div>
          <Link
            href="/leagues/create"
            className="inline-flex items-center justify-center bg-white/10 hover:bg-white/20 text-white font-semibold py-3 px-6 rounded-2xl border border-white/10 backdrop-blur-md transition-all active:scale-95"
          >
            <span className="mr-2 text-xl">+</span> Nouvelle Ligue
          </Link>
        </div>

        {leagues.length === 0 ? (
          <div className="glass-card p-12 rounded-3xl text-center border border-white/5">
            <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">🎾</span>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Aucune ligue trouvée</h3>
            <p className="text-slate-400 mb-8 max-w-sm mx-auto">
              Vous n&apos;avez pas encore créé de ligue. Commencez dès maintenant pour organiser vos sessions.
            </p>
            <Link
              href="/leagues/create"
              className="inline-block bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-3 px-10 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all"
            >
              Créer ma première ligue
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(leagues as LeagueUI[]).map((league) => (
              <Link key={league.id} href={`/leagues/${league.id}`}>
                <div className="glass-card p-6 rounded-3xl border border-white/10 hover:border-emerald-500/30 transition-all group cursor-pointer h-full flex flex-col">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <span className="text-2xl">🏆</span>
                    </div>
                    <span className="text-xs font-medium px-3 py-1 bg-white/5 rounded-full text-slate-400 border border-white/5">
                      {(league.settings as LeagueSettings)?.maxPlayers || 0} Joueurs
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-emerald-400 transition-colors">
                    {league.name}
                  </h3>
                  <p className="text-slate-400 text-sm line-clamp-2 mb-6 flex-grow">
                    {league.description || "Aucune description fournie."}
                  </p>
                  <div className="pt-4 border-t border-white/5 flex items-center text-emerald-400 text-sm font-semibold">
                    Voir les détails <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
