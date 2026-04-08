import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { SettingsForm } from "./settings-form";
import { addCourt } from "@/actions/courts";
import { CourtList } from "./court-list";
import { ImportExportCard } from "@/components/leagues/import-export-card";
import { CoManagementSection } from "@/components/leagues/co-management-section";
import { getEnsuredUser } from "@/lib/auth-utils";

export default async function LeagueSettingsPage({ params }: { params: { id: string } }) {
  const user = await getEnsuredUser();
  const league = await prisma.league.findUnique({
    where: { id: params.id },
    include: { 
        courts: true,
        coManagers: {
            include: {
                manager: {
                    select: { id: true, email: true, name: true }
                }
            }
        }
    },
  });

  if (!league) notFound();

  const isOwner = league.managerId === user.id;

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
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-12">
      <div>
        <h1 className="text-5xl font-black text-white mb-2 tracking-tighter uppercase">Paramètres</h1>
        <p className="text-slate-500 font-medium">Configurez votre ligue et gérez votre équipe.</p>
      </div>

      <SettingsForm league={league} settings={settings}>
        <div className="space-y-12 mt-8">
          {/* Section Co-Gestion */}
          <CoManagementSection 
            leagueId={league.id} 
            coManagers={league.coManagers} 
            isOwner={isOwner}
          />

          {/* Section Terrains */}
          <section className="bg-slate-800/20 backdrop-blur-md border border-white/5 rounded-2xl p-8 shadow-xl">
            <div className="flex justify-between items-center mb-8">
               <div>
                    <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Gestion des terrains</h2>
                    <p className="text-slate-500 text-xs font-medium">Configurez les terrains disponibles pour vos matchs.</p>
               </div>
               {isOwner && (
                <form action={addCourt.bind(null, league.id)}>
                    <button
                        type="submit"
                        className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-black tracking-widest rounded-xl transition-all uppercase"
                    >
                        + Ajouter un terrain
                    </button>
                </form>
               )}
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
