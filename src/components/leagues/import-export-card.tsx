"use client";

import { useState } from "react";
import { Download, Upload, FileJson, Check, AlertCircle, Loader2 } from "lucide-react";
import { exportLeagueData } from "@/actions/export";
import { importLeaguePlayers } from "@/actions/import";
import { GlassCard } from "@/components/ui/gtr/glass-card";

export function ImportExportCard({ leagueId }: { leagueId: string }) {
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    async function handleExport() {
        setLoading(true);
        setStatus(null);
        try {
            const data = await exportLeagueData(leagueId);
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `league-${leagueId}-export.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            setStatus({ type: 'success', message: "Exportation réussie !" });
        } catch (error) {
            console.error(error);
            setStatus({ type: 'error', message: "Erreur lors de l'exportation." });
        } finally {
            setLoading(false);
        }
    }

    async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        setLoading(true);
        setStatus(null);
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const json = JSON.parse(event.target?.result as string);
                // Le format attendu peut être l'export complet ou juste une liste de joueurs
                const players = json.players || (Array.isArray(json) ? json : null);
                
                if (!players) {
                    throw new Error("Format d'importation non reconnu. Le JSON doit contenir une clé 'players' ou être un tableau de joueurs.");
                }

                const result = await importLeaguePlayers(leagueId, players);
                if (result.success) {
                    setStatus({ 
                        type: 'success', 
                        message: `Importation réussie : ${result.results.created} créés, ${result.results.updated} mis à jour.` 
                    });
                }
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : "Erreur lors de l'importation.";
                console.error(error);
                setStatus({ type: 'error', message: errorMessage });
            } finally {
                setLoading(false);
                e.target.value = ''; // Réinitialise l'input
            }
        };
        reader.readAsText(file);
    }

    return (
        <GlassCard className="p-6">
            <h2 className="text-xl font-semibold text-emerald-400 mb-6 flex items-center gap-2">
                <FileJson className="w-5 h-5" />
                Données de la ligue
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                    onClick={handleExport}
                    disabled={loading}
                    className="flex items-center justify-center gap-3 p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all group"
                >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin text-pickle-green" /> : <Download className="w-5 h-5 text-pickle-green group-hover:scale-110 transition-transform" />}
                    <div className="text-left">
                        <div className="font-bold text-white">Exporter</div>
                        <div className="text-xs text-slate-400 text-pretty">Télécharger toutes les données (JSON)</div>
                    </div>
                </button>

                <label className="flex items-center justify-center gap-3 p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all group cursor-pointer">
                    <input 
                        type="file" 
                        accept=".json" 
                        className="hidden" 
                        onChange={handleImport}
                        disabled={loading}
                    />
                    {loading ? <Loader2 className="w-5 h-5 animate-spin text-pickle-blue" /> : <Upload className="w-5 h-5 text-pickle-blue group-hover:scale-110 transition-transform" />}
                    <div className="text-left">
                        <div className="font-bold text-white">Importer</div>
                        <div className="text-xs text-slate-400 text-pretty">Charger des joueurs depuis un fichier JSON</div>
                    </div>
                </label>
            </div>

            {status && (
                <div className={`mt-4 p-3 rounded-lg flex items-center gap-3 text-sm font-medium animate-in fade-in slide-in-from-top-2 ${
                    status.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'
                }`}>
                    {status.type === 'success' ? <Check className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                    {status.message}
                </div>
            )}
        </GlassCard>
    );
}
