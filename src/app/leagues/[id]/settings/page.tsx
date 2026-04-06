import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { updateLeague } from "@/actions/league";
import { addCourt } from "@/actions/courts";
import { CourtList } from "./court-list";

export default async function LeagueSettingsPage({ params }: { params: { id: string } }) {
  const league = await prisma.league.findUnique({
    where: { id: params.id },
    include: { courts: true },
  });

  if (!league) notFound();

  interface LeagueSettings {
    maxPlayers?: number;
    levelMin?: number;
    levelMax?: number;
  }
  const settings = league.settings as LeagueSettings;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-white mb-8">Paramètres de la ligue</h1>

      <div className="space-y-8">
        {/* Section Informations */}
        <section className="bg-slate-800/40 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-xl">
          <h2 className="text-xl font-semibold text-emerald-400 mb-6">Informations générales</h2>
          <form action={updateLeague.bind(null, league.id)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Nom de la ligue</label>
              <input
                type="text"
                name="name"
                defaultValue={league.name}
                className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
              <textarea
                name="description"
                defaultValue={league.description || ""}
                rows={3}
                className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Joueurs max / terrain</label>
                <input
                  type="number"
                  name="maxPlayers"
                  defaultValue={settings?.maxPlayers || 4}
                  className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Niveau Min</label>
                <input
                  type="number"
                  step="0.5"
                  name="levelMin"
                  defaultValue={settings?.levelMin || 2.0}
                  className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Niveau Max</label>
                <input
                  type="number"
                  step="0.5"
                  name="levelMax"
                  defaultValue={settings?.levelMax || 5.0}
                  className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                />
              </div>
            </div>
            <button
              type="submit"
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-emerald-900/20"
            >
              Enregistrer les modifications
            </button>
          </form>
        </section>

        {/* Section Terrains */}
        <section className="bg-slate-800/40 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-xl">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-emerald-400">Gestion des terrains</h2>
            <form action={addCourt.bind(null, league.id)}>
              <button
                type="submit"
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium rounded-lg transition-all"
              >
                + Ajouter un terrain
              </button>
            </form>
          </div>
          
          <CourtList 
            courts={league.courts} 
            leagueId={league.id}
          />
        </section>
      </div>
    </div>
  );
}
