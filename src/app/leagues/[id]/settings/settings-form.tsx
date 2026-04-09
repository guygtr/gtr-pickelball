"use client";

import { useState } from "react";
import { updateLeague } from "@/actions/league";
import { useRouter } from "next/navigation";
import { Save, CheckCircle2, Trash2 } from "lucide-react";
import { NeonButton } from "@/components/ui/gtr/neon-button";
import toast from "react-hot-toast";
import { deleteLeague } from "@/actions/league";

interface SettingsFormProps {
  league: {
    id: string;
    name: string;
    description: string | null;
  };
  settings: {
    maxPlayers?: number;
    levelMin?: number;
    levelMax?: number;
    defaultStartTime?: string;
    defaultDuration?: number;
    defaultLocation?: string;
  };
  isOwner: boolean;
  children?: React.ReactNode;
}

export function SettingsForm({ league, settings, isOwner, children }: SettingsFormProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = async (formData: FormData) => {
    setIsSaving(true);
    try {
      await updateLeague(league.id, formData);
      setShowSuccess(true);
      setTimeout(() => {
        router.push(`/leagues/${league.id}`);
        router.refresh();
      }, 1500);
    } catch (error) {
      console.error("Erreur lors de la sauvegarde :", error);
      alert("Une erreur est survenue lors de la sauvegarde.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    const confirmMsg = isOwner 
      ? `ATTENTION : Êtes-vous certain de vouloir SUPPRIMER DÉFINITIVEMENT la ligue "${league.name}" ? Toutes les données (joueurs, matchs, historiques) seront perdues.`
      : `Voulez-vous vraiment quitter la co-gestion de la ligue "${league.name}" ?`;
    
    if (!confirm(confirmMsg)) return;

    setIsSaving(true);
    try {
      const res = await deleteLeague(league.id);
      
      if (res.success) {
        toast.success(isOwner ? "Ligue supprimée de la flotte." : "La ligue a été retirée de votre accès.");
        router.push("/leagues");
        router.refresh();
      } else {
        toast.error(res.error || "Une erreur est survenue.");
      }
    } catch (error) {
      console.error("Erreur deletLeague:", error);
      toast.error("Erreur critique lors de la suppression.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {showSuccess && (
        <div className="bg-emerald-500/10 border border-emerald-500/50 text-emerald-400 p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-5 h-5" />
          <p className="font-medium">Paramètres enregistrés avec succès. Redirection...</p>
        </div>
      )}

      <form action={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Nom de la ligue</label>
            <input
              type="text"
              name="name"
              defaultValue={league.name}
              required
              className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all placeholder:text-slate-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
            <textarea
              name="description"
              defaultValue={league.description || ""}
              rows={3}
              className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
              placeholder="Décrivez votre ligue..."
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
              <label className="block text-sm font-medium text-slate-300 mb-2">Niveau Min (1-6)</label>
              <input
                type="number"
                step="0.5"
                name="levelMin"
                defaultValue={settings?.levelMin || 2.0}
                className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Niveau Max (1-6)</label>
              <input
                type="number"
                step="0.5"
                name="levelMax"
                defaultValue={settings?.levelMax || 5.0}
                className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
              />
            </div>
          </div>

          <div className="h-px bg-white/5 my-4" />
          <h3 className="text-lg font-semibold text-slate-200">Paramètres de session par défaut</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Heure de début</label>
              <input
                type="time"
                name="defaultStartTime"
                defaultValue={settings?.defaultStartTime || "19:00"}
                className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Durée (minutes)</label>
              <input
                type="number"
                name="defaultDuration"
                defaultValue={settings?.defaultDuration || 120}
                className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Lieu par défaut</label>
            <input
              type="text"
              name="defaultLocation"
              defaultValue={settings?.defaultLocation || ""}
              className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
              placeholder="Ex: Centre Sportif, Court Extérieur..."
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 pt-8 border-t border-white/5">
          <NeonButton
            type="submit"
            disabled={isSaving}
            variant="primary"
            className="flex-1 py-4"
          >
            {isSaving ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            ENREGISTRER LES MODIFICATIONS
          </NeonButton>
        </div>
      </form>

      {children}

      {/* Zone de Danger */}
      <div className="mt-20 pt-8 border-t border-pickle-tertiary/20">
        <h4 className="text-pickle-tertiary font-black text-xs tracking-[0.3em] uppercase mb-6 flex items-center gap-2">
            <span className="w-2 h-2 bg-pickle-tertiary rounded-full animate-pulse" />
            Zone de Danger
        </h4>
        <div className="bg-pickle-tertiary/5 border border-pickle-tertiary/10 rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
                <h5 className="text-white font-bold text-lg mb-1">
                    {isOwner ? "Supprimer définitivement la ligue" : "Quitter la co-gestion"}
                </h5>
                <p className="text-slate-500 text-sm font-medium max-w-md">
                    {isOwner 
                        ? "Cette action est irréversible. Toutes les données, joueurs et historiques seront effacés de la flotte GTR." 
                        : "Vous n'aurez plus accès à l'administration de cette ligue. Le propriétaire pourra vous ré-inviter si nécessaire."}
                </p>
            </div>
            <button
                onClick={handleDelete}
                disabled={isSaving}
                className="w-full md:w-auto px-8 py-4 bg-pickle-tertiary/10 hover:bg-pickle-tertiary/20 border border-pickle-tertiary/30 text-pickle-tertiary text-xs font-black tracking-widest rounded-xl transition-all uppercase whitespace-nowrap flex items-center justify-center gap-2"
            >
                <Trash2 className="w-4 h-4" />
                {isOwner ? "Supprimer la ligue" : "Quitter la ligue"}
            </button>
        </div>
      </div>
    </div>
  );
}
