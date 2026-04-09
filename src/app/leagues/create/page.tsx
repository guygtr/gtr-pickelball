"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createLeague } from "@/actions/league";
import { restoreLeagueFromBackup } from "@/actions/import";
import toast from "react-hot-toast";
import { Plus, Trophy, Layout, Settings, Target, Upload, FileJson } from "lucide-react";
import { GlassCard } from "@/components/ui/gtr/glass-card";
import { NeonButton } from "@/components/ui/gtr/neon-button";

export default function CreateLeaguePage() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  async function handleCreate(formData: FormData) {
    setIsPending(true);
    const loadingToast = toast.loading("Orchestration de la ligue en cours...");

    try {
      const result = await createLeague(formData);
      
      if (!result.success) {
        toast.error(result.error || "Échec de la création", { id: loadingToast });
        return;
      }

      toast.success("Ligue créée ! Veuillez maintenant configurer vos terrains et horaires par défaut.", { 
        id: loadingToast,
        duration: 6000 
      });
      router.push(`/leagues/${result.id}/settings`);
      router.refresh();
    } catch (e: any) {
      toast.error("Erreur technique lors de la création.", { id: loadingToast });
    } finally {
      setIsPending(false);
    }
  }

  async function handleRestore(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsPending(true);
    const loadingToast = toast.loading("Restauration de la ligue en cours...");

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        const importSessions = window.confirm("Voulez-vous importer également l'historique des sessions ?");
        
        const result: any = await restoreLeagueFromBackup(json, importSessions);
        
        if (result.success) {
          toast.success("Ligue restaurée avec succès !", { id: loadingToast });
          router.push(`/leagues/${result.id}`);
          router.refresh();
        } else {
          toast.error(result.error || "Échec de la restauration", { id: loadingToast });
        }
      } catch (err) {
        toast.error("Format de fichier invalide.", { id: loadingToast });
      } finally {
        setIsPending(false);
      }
    };
    reader.readAsText(file);
  }

  return (
    <main className="min-h-screen pt-24 pb-20 px-4">
      <div className="max-w-3xl mx-auto animate-fade-in-up">
        {/* Header Section */}
        <div className="flex items-center gap-4 mb-10">
          <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center border border-accent/20">
            <Trophy className="w-8 h-8 text-accent shrink-0" />
          </div>
          <div className="space-y-1">
            <h1 className="text-4xl font-black tracking-tighter text-white uppercase leading-none">
              Nouvelle <span className="text-gradient">Ligue</span>
            </h1>
            <p className="text-slate-500 font-medium text-sm">Configurez les paramètres de votre organisation premium.</p>
          </div>
        </div>

        <GlassCard className="p-8 md:p-12 relative overflow-hidden group">
          {/* Subtle Background Glow */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-accent/5 rounded-full blur-3xl group-hover:bg-accent/10 transition-colors duration-700" />
          
          <form action={handleCreate} className="space-y-10 relative z-10">
            {/* Section 1: Identité */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-accent/60 mb-2">
                <Layout className="w-4 h-4" />
                <span className="text-[10px] font-black tracking-[0.3em] uppercase">Identité Globale</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Nom de la Ligue</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    placeholder="Ex: Ligue du Lundi Soir"
                    className="w-full bg-slate-900/40 border border-white/5 rounded-2xl px-5 py-4 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all font-medium"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="courtCount" className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Nombre de Terrains</label>
                  <input
                    type="number"
                    id="courtCount"
                    name="courtCount"
                    required
                    defaultValue={1}
                    min={1}
                    max={10}
                    className="w-full bg-slate-900/40 border border-white/5 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all font-medium"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="description" className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Description (facultatif)</label>
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  placeholder="Quelques mots sur l'ambiance et l'organisation..."
                  className="w-full bg-slate-900/40 border border-white/5 rounded-2xl px-5 py-4 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all font-medium resize-none"
                />
              </div>
            </div>

            {/* Section 2: Paramètres Sportifs */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-accent/60 mb-2">
                <Settings className="w-4 h-4" />
                <span className="text-[10px] font-black tracking-[0.3em] uppercase">Configuration Sportive</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-2">
                  <label htmlFor="maxPlayers" className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Max Joueurs</label>
                  <input
                    type="number"
                    id="maxPlayers"
                    name="maxPlayers"
                    required
                    defaultValue={12}
                    min={2}
                    className="w-full bg-slate-900/40 border border-white/5 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all font-medium"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="levelMin" className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Niveau Min</label>
                  <select
                    id="levelMin"
                    name="levelMin"
                    className="w-full bg-slate-900/40 border border-white/5 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all font-medium appearance-none cursor-pointer"
                  >
                    <option value="2.0">2.0 (Débutant)</option>
                    <option value="2.5">2.5</option>
                    <option value="3.0">3.0 (Intermédiaire)</option>
                    <option value="3.5">3.5</option>
                    <option value="4.0">4.0 (Avancé)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="levelMax" className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Niveau Max</label>
                  <select
                    id="levelMax"
                    name="levelMax"
                    className="w-full bg-slate-900/40 border border-white/5 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all font-medium appearance-none cursor-pointer"
                  >
                    <option value="3.5">3.5</option>
                    <option value="4.0">4.0</option>
                    <option value="4.5">4.5</option>
                    <option value="5.0">5.0 (Elite)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-6 border-t border-white/5 flex flex-col md:flex-row gap-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 bg-white/5 hover:bg-white/10 text-white font-black py-5 rounded-2xl tracking-[0.2em] transition-all uppercase text-xs"
              >
                Annuler
              </button>
              
              <label className="flex-[1] flex items-center justify-center gap-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 font-black py-5 rounded-2xl tracking-[0.1em] transition-all uppercase text-[10px] cursor-pointer text-center">
                <input 
                  type="file" 
                  accept=".json" 
                  className="hidden" 
                  onChange={handleRestore}
                  disabled={isPending}
                />
                <FileJson className="w-4 h-4" />
                RESTAURER
              </label>

              <NeonButton
                type="submit"
                variant="primary"
                className="flex-[2] py-5 tracking-[0.3em] font-black"
                disabled={isPending}
              >
                {isPending ? "INITIALISATION..." : "BÂTIR LA LIGUE"}
              </NeonButton>
            </div>
          </form>
        </GlassCard>
      </div>
    </main>
  );
}
