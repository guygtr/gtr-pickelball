"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createLeague } from "@/actions/league";
import { restoreLeagueFromBackup } from "@/actions/import";
import toast from "react-hot-toast";
import { Layout, Upload, FileJson, Plus } from "lucide-react";
import { GlassCard } from "@/components/ui/gtr/glass-card";
import { NeonButton } from "@/components/ui/gtr/neon-button";

/**
 * Création de ligue — P1 UI : titres sobres, 1 CTA primary, tabs calmes.
 */
export default function CreateLeaguePage() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [activeTab, setActiveTab] = useState<"manual" | "restore">("manual");

  async function handleCreate(formData: FormData) {
    setIsPending(true);
    const loadingToast = toast.loading("Création de la ligue…");

    try {
      const result = await createLeague(formData);

      if (!result.success) {
        toast.error(result.error || "Échec de la création", { id: loadingToast });
        return;
      }

      toast.success("Ligue créée. Configurez les terrains.", {
        id: loadingToast,
        duration: 5000,
      });
      router.push(`/leagues/${result.id}/settings`);
      router.refresh();
    } catch {
      toast.error("Erreur technique lors de la création.", { id: loadingToast });
    } finally {
      setIsPending(false);
    }
  }

  async function handleRestore(
    e: React.ChangeEvent<HTMLInputElement> | React.DragEvent
  ) {
    let file: File | undefined;

    if ("files" in e.target && e.target.files) {
      file = e.target.files[0];
    } else if ("dataTransfer" in e && e.dataTransfer.files) {
      e.preventDefault();
      file = e.dataTransfer.files[0];
    }

    if (!file) return;

    setIsPending(true);
    const loadingToast = toast.loading("Restauration en cours…");

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        const importSessions = window.confirm(
          "Importer également l'historique des sessions ?"
        );

        const result = (await restoreLeagueFromBackup(
          json,
          importSessions
        )) as { success: boolean; id?: string; error?: string };

        if (result.success) {
          toast.success("Ligue restaurée.", { id: loadingToast });
          router.push(`/leagues/${result.id}`);
          router.refresh();
        } else {
          toast.error(result.error || "Échec de la restauration", {
            id: loadingToast,
          });
        }
      } catch {
        toast.error("Fichier JSON invalide.", { id: loadingToast });
      } finally {
        setIsPending(false);
      }
    };
    reader.readAsText(file);
  }

  return (
    <main className="min-h-screen pt-24 pb-20 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-10 space-y-2">
          <div className="flex items-center gap-2 text-slate-400 text-sm font-medium">
            <Plus className="w-4 h-4 text-pickle-primary" />
            <span>Nouvelle ligue</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-white">
            Configurer votre ligue
          </h1>
          <p className="text-slate-500 text-sm max-w-md">
            Créez une ligue manuellement ou restaurez un backup JSON.
          </p>
        </div>

        <GlassCard className="p-0 overflow-hidden" hoverEffect={false}>
          <div className="flex border-b border-white/10 bg-black/20">
            <button
              type="button"
              onClick={() => setActiveTab("manual")}
              className={`flex-1 py-3.5 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                activeTab === "manual"
                  ? "text-white bg-white/5 border-b-2 border-pickle-primary"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              <Layout className="w-4 h-4" />
              Manuelle
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("restore")}
              className={`flex-1 py-3.5 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                activeTab === "restore"
                  ? "text-white bg-white/5 border-b-2 border-pickle-primary"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              <Upload className="w-4 h-4" />
              Backup JSON
            </button>
          </div>

          <div className="p-6 md:p-10 relative">
            {activeTab === "manual" ? (
              <form action={handleCreate} className="space-y-8 relative z-10">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label
                      htmlFor="name"
                      className="text-xs font-medium text-slate-400 pl-0.5"
                    >
                      Nom de la ligue
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      required
                      placeholder="Ex. : Sunset Pickleball Club"
                      className="w-full neon-input rounded-xl px-4 py-3 text-white placeholder-slate-600 text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label
                        htmlFor="maxPlayers"
                        className="text-xs font-medium text-slate-400 pl-0.5"
                      >
                        Capacité (joueurs)
                      </label>
                      <input
                        type="number"
                        id="maxPlayers"
                        name="maxPlayers"
                        required
                        defaultValue={20}
                        min={2}
                        className="w-full neon-input rounded-xl px-4 py-3 text-white text-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <label
                        htmlFor="courtCount"
                        className="text-xs font-medium text-slate-400 pl-0.5"
                      >
                        Nombre de terrains
                      </label>
                      <input
                        type="number"
                        id="courtCount"
                        name="courtCount"
                        required
                        defaultValue={4}
                        min={1}
                        max={20}
                        className="w-full neon-input rounded-xl px-4 py-3 text-white text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="description"
                      className="text-xs font-medium text-slate-400 pl-0.5"
                    >
                      Description (optionnel)
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      rows={2}
                      placeholder="Quelques mots sur votre organisation…"
                      className="w-full neon-input rounded-xl px-4 py-3 text-white placeholder-slate-600 text-sm resize-none"
                    />
                  </div>
                </div>

                <div className="space-y-6 pt-2 border-t border-white/5">
                  <p className="text-xs font-medium text-slate-500 pt-4">
                    Plage de niveaux
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label
                        htmlFor="levelMin"
                        className="text-xs font-medium text-slate-400 pl-0.5"
                      >
                        Niveau min
                      </label>
                      <select
                        id="levelMin"
                        name="levelMin"
                        className="w-full neon-input rounded-xl px-4 py-3 text-white text-sm cursor-pointer appearance-none"
                      >
                        <option value="2.0">2.0 — Débutant</option>
                        <option value="3.0">3.0 — Intermédiaire</option>
                        <option value="4.0">4.0 — Avancé</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label
                        htmlFor="levelMax"
                        className="text-xs font-medium text-slate-400 pl-0.5"
                      >
                        Niveau max
                      </label>
                      <select
                        id="levelMax"
                        name="levelMax"
                        className="w-full neon-input rounded-xl px-4 py-3 text-white text-sm cursor-pointer appearance-none"
                      >
                        <option value="4.0">4.0</option>
                        <option value="4.5">4.5</option>
                        <option value="5.0">5.0 — Élite</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex flex-col gap-3">
                  <NeonButton
                    type="submit"
                    variant="primary"
                    className="w-full py-4"
                    disabled={isPending}
                  >
                    {isPending ? "Création…" : "Créer la ligue"}
                  </NeonButton>

                  <button
                    type="button"
                    onClick={() => router.back()}
                    className="w-full py-2.5 text-sm font-medium text-slate-500 hover:text-white transition-colors"
                  >
                    Annuler
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-8 relative z-10 py-4">
                <div className="text-center max-w-sm mx-auto space-y-3">
                  <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center mx-auto border border-white/10">
                    <FileJson className="w-7 h-7 text-pickle-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-white tracking-tight">
                    Restaurer un backup
                  </h3>
                  <p className="text-slate-500 text-sm leading-relaxed">
                    Importez un fichier JSON pour reconstruire une ligue et,
                    optionnellement, son historique de sessions.
                  </p>
                </div>

                <label
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.add(
                      "border-pickle-primary/40",
                      "bg-pickle-primary/5"
                    );
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.remove(
                      "border-pickle-primary/40",
                      "bg-pickle-primary/5"
                    );
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    handleRestore(e as unknown as React.DragEvent);
                  }}
                  className="block w-full border-2 border-dashed border-white/10 rounded-2xl p-12 text-center cursor-pointer transition-all hover:bg-white/[0.03] group"
                >
                  <input
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={handleRestore}
                    disabled={isPending}
                  />
                  <div className="space-y-4">
                    <div className="flex justify-center">
                      <div className="p-4 bg-black/40 rounded-xl border border-white/5 group-hover:border-pickle-primary/25 transition-colors">
                        <Upload className="w-6 h-6 text-pickle-primary" />
                      </div>
                    </div>
                    <div>
                      <span className="text-white font-medium block mb-1 text-sm">
                        Glisser-déposer un fichier .json
                      </span>
                      <span className="text-slate-500 text-xs">
                        ou cliquer pour parcourir
                      </span>
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
