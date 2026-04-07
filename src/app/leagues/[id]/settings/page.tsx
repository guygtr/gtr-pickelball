import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { SettingsForm } from "./settings-form";
import { addCourt } from "@/actions/courts";
import { CourtList } from "./court-list";
import { ImportExportCard } from "@/components/leagues/import-export-card";

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
    defaultStartTime?: string;
    defaultDuration?: number;
    defaultLocation?: string;
  }
  const settings = (league.settings || {}) as LeagueSettings;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-white mb-8">Paramètres de la ligue</h1>

      <SettingsForm league={league} settings={settings}>
        <div className="space-y-8 mt-8">
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

          {/* Section Import/Export */}
          <ImportExportCard leagueId={league.id} leagueName={league.name} />
        </div>
      </SettingsForm>
    </div>
  );
}
