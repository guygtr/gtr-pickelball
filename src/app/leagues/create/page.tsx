"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createLeague } from "@/actions/league";
import { restoreLeagueFromBackup } from "@/actions/import";
import toast from "react-hot-toast";
import { Plus, Trophy, Layout, Settings, Target, Upload, FileJson, ArrowRight, ShieldCheck } from "lucide-react";
import { GlassCard } from "@/components/ui/gtr/glass-card";
import { NeonButton } from "@/components/ui/gtr/neon-button";

export default function CreateLeaguePage() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [activeTab, setActiveTab] = useState<'manual' | 'restore'>('manual');

  async function handleCreate(formData: FormData) {
    setIsPending(true);
    const loadingToast = toast.loading("Orchestration de la ligue en cours...");

    try {
      const result = await createLeague(formData);
      
      if (!result.success) {
        toast.error(result.error || "Échec de la création", { id: loadingToast });
        return;
      }

      toast.success("Ligue créée ! Configuration des terrains requise.", { 
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

  async function handleRestore(e: React.ChangeEvent<HTMLInputElement> | React.DragEvent) {
    let file: File | undefined;
    
    if ('files' in e.target && e.target.files) {
      file = e.target.files[0];
    } else if ('dataTransfer' in e && e.dataTransfer.files) {
      e.preventDefault();
      file = e.dataTransfer.files[0];
    }

    if (!file) return;

    setIsPending(true);
    const loadingToast = toast.loading("Lancement de la restauration...");

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        const importSessions = window.confirm("Importer également l'historique des sessions ?");
        
        const result: any = await restoreLeagueFromBackup(json, importSessions);
        
        if (result.success) {
          toast.success("Système restauré !", { id: loadingToast });
          router.push(`/leagues/${result.id}`);
          router.refresh();
        } else {
          toast.error(result.error || "Échec de la restauration", { id: loadingToast });
        }
      } catch (err) {
        toast.error("Format corrompu.", { id: loadingToast });
      } finally {
        setIsPending(false);
      }
    };
    reader.readAsText(file);
  }

  return (
    <main className="min-h-screen pt-24 pb-20 px-4 bg-[#020617]/50">
      <div className="max-w-3xl mx-auto animate-fade-in-up">
        
        {/* Elite Header Style Mockup */}
        <div className="text-center mb-12 space-y-4">
          <div className="inline-flex items-center justify-center p-3 bg-cyan-500/10 rounded-full border border-cyan-500/20 mb-2">
            <ShieldCheck className="w-6 h-6 text-cyan-400" />
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-[0.15em] uppercase neon-text-green">
            Configurer votre ligue
          </h1>
          <div className="h-1 w-20 bg-gradient-to-r from-cyan-500 to-pickle-secondary mx-auto rounded-full opacity-50" />
        </div>

        <GlassCard variant="neon" className="p-0 overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]">
          {/* Tab Switcher - Style Maquette */}
          <div className="flex border-b border-cyan-500/10 bg-black/20">
            <button
              onClick={() => setActiveTab('manual')}
              className={`flex-1 py-5 text-[10px] font-black uppercase tracking-[0.25em] transition-all flex items-center justify-center gap-3 ${
                activeTab === 'manual' 
                  ? 'text-[#dcfc44] bg-cyan-500/5' 
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Layout className="w-4 h-4" />
              Configuration Manuelle
            </button>
            <button
              onClick={() => setActiveTab('restore')}
              className={`flex-1 py-5 text-[10px] font-black uppercase tracking-[0.25em] transition-all flex items-center justify-center gap-3 ${
                activeTab === 'restore' 
                  ? 'text-[#dcfc44] bg-cyan-500/5' 
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Upload className="w-4 h-4" />
              Backup GTR
            </button>
          </div>

          <div className="p-8 md:p-14 relative">
            {activeTab === 'manual' ? (
              <form action={handleCreate} className="space-y-12 relative z-10">
                {/* Section: Identité */}
                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-3">
                      <label htmlFor="name" className="text-[9px] font-black text-cyan-400/60 uppercase tracking-[0.3em] pl-1">Nom de la Ligue</label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        required
                        placeholder="Ex: Sunset Pickleball Club"
                        className="w-full neon-input rounded-xl px-6 py-4 text-white placeholder-slate-700 text-sm font-bold"
                      />
                    </div>

                    <div className="space-y-3">
                      <label htmlFor="courtCount" className="text-[9px] font-black text-cyan-400/60 uppercase tracking-[0.3em] pl-1">Capacité (Terrains)</label>
                      <input
                        type="number"
                        id="courtCount"
                        name="courtCount"
                        required
                        defaultValue={2}
                        min={1}
                        className="w-full neon-input rounded-xl px-6 py-4 text-white text-sm font-bold"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label htmlFor="description" className="text-[9px] font-black text-cyan-400/60 uppercase tracking-[0.3em] pl-1">Description brève</label>
                    <textarea
                      id="description"
                      name="description"
                      rows={2}
                      placeholder="Identité visuelle et réglementaire de votre organisation..."
                      className="w-full neon-input rounded-xl px-6 py-4 text-white placeholder-slate-700 text-sm font-bold resize-none"
                    />
                  </div>
                </div>

                {/* Section: Sportive */}
                <div className="space-y-8 pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-3">
                      <label htmlFor="levelMin" className="text-[9px] font-black text-cyan-400/60 uppercase tracking-[0.3em] pl-1">Seuil de Niveau (Min)</label>
                      <select
                        id="levelMin"
                        name="levelMin"
                        className="w-full neon-input rounded-xl px-6 py-4 text-white text-sm font-bold cursor-pointer appearance-none"
                      >
                        <option value="2.0">2.0 - Débutant</option>
                        <option value="3.0">3.0 - Intermédiaire</option>
                        <option value="4.0">4.0 - Avancé</option>
                      </select>
                    </div>

                    <div className="space-y-3">
                      <label htmlFor="levelMax" className="text-[9px] font-black text-cyan-400/60 uppercase tracking-[0.3em] pl-1">Seuil de Niveau (Max)</label>
                      <select
                        id="levelMax"
                        name="levelMax"
                        className="w-full neon-input rounded-xl px-6 py-4 text-white text-sm font-bold cursor-pointer appearance-none"
                      >
                        <option value="4.0">4.0</option>
                        <option value="4.5">4.5</option>
                        <option value="5.0">5.0 - Elite GTR</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Final Actions - Style Maquette */}
                <div className="pt-10 flex flex-col gap-5">
                  <NeonButton
                    type="submit"
                    variant="acid"
                    className="w-full py-6 tracking-[0.4em] text-xs font-black"
                    disabled={isPending}
                  >
                    {isPending ? "SYNCHRONISATION..." : "BÂTIR LA LIGUE"}
                  </NeonButton>
                  
                  <button
                    type="button"
                    onClick={() => router.back()}
                    className="w-full py-3 text-[9px] font-black text-slate-600 hover:text-white transition-colors uppercase tracking-[0.3em]"
                  >
                    Annuler la procédure
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-12 relative z-10 animate-in fade-in zoom-in-95 duration-500 py-6">
                <div className="text-center max-w-sm mx-auto space-y-4 mb-10">
                  <div className="w-16 h-16 bg-cyan-500/10 rounded-2xl flex items-center justify-center mx-auto border border-cyan-500/20 mb-6 rotate-3">
                    <FileJson className="w-8 h-8 text-cyan-400" />
                  </div>
                  <h3 className="text-lg font-black text-white uppercase tracking-tighter">Restauration Système</h3>
                  <p className="text-slate-500 text-[11px] leading-relaxed font-bold uppercase tracking-wide">
                    Injectez vos données JSON pour reconstruire instantanément votre environnement de ligue.
                  </p>
                </div>

                <label 
                  onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('border-cyan-400/50', 'bg-cyan-400/5'); }}
                  onDragLeave={(e) => { e.preventDefault(); e.currentTarget.classList.remove('border-cyan-400/50', 'bg-cyan-400/5'); }}
                  onDrop={(e) => { e.preventDefault(); handleRestore(e as unknown as React.DragEvent); }}
                  className="block w-full border-2 border-dashed border-cyan-500/10 rounded-[2rem] p-16 text-center cursor-pointer transition-all hover:bg-cyan-500/[0.03] group"
                >
                  <input type="file" accept=".json" className="hidden" onChange={handleRestore} disabled={isPending} />
                  <div className="space-y-6">
                    <div className="flex justify-center">
                      <div className="p-5 bg-black/40 rounded-2xl border border-white/5 group-hover:border-cyan-500/30 transition-colors">
                         <Upload className="w-8 h-8 text-[#dcfc44]" />
                      </div>
                    </div>
                    <div>
                      <span className="text-white font-black block mb-2 uppercase tracking-[0.2em] text-[10px]">Glisser-Déposer</span>
                      <span className="text-slate-600 text-[9px] font-bold uppercase tracking-[0.3em]">ou parcourir le poste</span>
                    </div>
                  </div>
                </label>
              </div>
            )}
          </div>
        </GlassCard>
      </div>
    </main>
  );
}
