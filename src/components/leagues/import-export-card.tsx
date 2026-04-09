"use client";

import { useState, useRef } from "react";
import { Download, Upload, FileJson, Check, AlertCircle, Loader2, Users, CalendarDays, RefreshCw } from "lucide-react";
import { exportLeagueData } from "@/actions/export";
import { smartImportIntoLeague } from "@/actions/import";
import { GlassCard } from "@/components/ui/gtr/glass-card";

export function ImportExportCard({ leagueId, leagueName }: { leagueId: string, leagueName?: string }) {
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    const [importMode, setImportMode] = useState<'PLAYERS' | 'SESSIONS' | 'FULL' | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const triggerImport = (mode: 'PLAYERS' | 'SESSIONS' | 'FULL') => {
        setImportMode(mode);
        fileInputRef.current?.click();
    };

    async function handleExport() {
        setLoading(true);
        setStatus(null);
        try {
            const data = await exportLeagueData(leagueId);
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            
            // Format: gtr-pickleball-<nom_de_la_ligue>-export-YYYY-MM-DD.json
            const dateStr = new Date().toISOString().split('T')[0];
            const safeLeagueName = (leagueName || leagueId).toLowerCase().replace(/[^a-z0-9]/g, '-');
            a.download = `gtr-pickleball-${safeLeagueName}-export-${dateStr}.json`;
            
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
        if (!file || !importMode) return;

        setLoading(true);
        setStatus(null);
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const json = JSON.parse(event.target?.result as string);
                
                // Vérifier grossièrement si c'est un format GTR
                if (!json.players) {
                    throw new Error("Format d'importation non valide. Impossible de trouver les données de joueurs.");
                }

                let result: any;
                if (importMode === 'PLAYERS') {
                    result = await smartImportIntoLeague(leagueId, json, { players: true, sessions: false });
                } else if (importMode === 'SESSIONS') {
                    result = await smartImportIntoLeague(leagueId, json, { players: false, sessions: true });
                } else {
                    result = await smartImportIntoLeague(leagueId, json, { players: true, sessions: true });
                }

                if (result.success && result.results) {
                    const { players, sessions } = result.results;
                    setStatus({ 
                        type: 'success', 
                        message: `Import réussi. Joueurs: ${players.created} créés (${players.skipped} ignorés). Sessions: ${sessions.created} créées (${sessions.skipped} ignorées).`
                    });
                } else {
                    throw new Error(result.error || "Erreur inconnue lors de l'import");
                }
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : "Erreur lors de l'importation.";
                console.error(error);
                setStatus({ type: 'error', message: errorMessage });
            } finally {
                setLoading(false);
                setImportMode(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
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

            <div className="flex flex-col gap-6">
                {/* Export */}
                <div className="flex items-center justify-between border-b border-white/5 pb-6">
                    <div>
                        <div className="font-bold text-white mb-1">Sauvegarde Complète</div>
                        <div className="text-sm text-slate-400">Télécharger toutes les données de cette ligue (JSON)</div>
                    </div>
                    <button
                        onClick={handleExport}
                        disabled={loading}
                        className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all font-bold text-pickle-green"
                    >
                        {loading && !importMode ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                        Exporter
                    </button>
                </div>

                {/* Importations */}
                <div>
                    <div className="font-bold text-white mb-4">Importer depuis une sauvegarde</div>
                    
                    <input 
                        type="file" 
                        accept=".json" 
                        className="hidden" 
                        ref={fileInputRef}
                        onChange={handleImport}
                        disabled={loading}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <button
                            onClick={() => triggerImport('PLAYERS')}
                            disabled={loading}
                            className="flex flex-col items-center justify-center gap-3 p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all"
                        >
                            {loading && importMode === 'PLAYERS' ? <Loader2 className="w-6 h-6 animate-spin text-pickle-blue" /> : <Users className="w-6 h-6 text-pickle-blue" />}
                            <div className="text-center">
                                <div className="font-bold text-sm text-white">Joueurs Seuls</div>
                                <div className="text-[10px] text-slate-500 uppercase mt-1">Fusion Sans Doublon</div>
                            </div>
                        </button>

                        <button
                            onClick={() => triggerImport('SESSIONS')}
                            disabled={loading}
                            className="flex flex-col items-center justify-center gap-3 p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all"
                        >
                            {loading && importMode === 'SESSIONS' ? <Loader2 className="w-6 h-6 animate-spin text-indigo-400" /> : <CalendarDays className="w-6 h-6 text-indigo-400" />}
                            <div className="text-center">
                                <div className="font-bold text-sm text-white">Sessions Seules</div>
                                <div className="text-[10px] text-slate-500 uppercase mt-1">Nouveaux Matchs</div>
                            </div>
                        </button>

                        <button
                            onClick={() => triggerImport('FULL')}
                            disabled={loading}
                            className="flex flex-col items-center justify-center gap-3 p-4 bg-emerald-500/5 hover:bg-emerald-500/10 border border-emerald-500/20 rounded-xl transition-all"
                        >
                            {loading && importMode === 'FULL' ? <Loader2 className="w-6 h-6 animate-spin text-emerald-400" /> : <RefreshCw className="w-6 h-6 text-emerald-400" />}
                            <div className="text-center">
                                <div className="font-bold text-sm text-emerald-300">Sync. Totale</div>
                                <div className="text-[10px] text-emerald-500/70 uppercase mt-1">Joueurs & Sessions</div>
                            </div>
                        </button>
                    </div>
                </div>
            </div>

            {status && (
                <div className={`mt-6 p-4 rounded-xl flex items-start gap-3 text-sm font-medium animate-in fade-in slide-in-from-top-2 ${
                    status.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'
                }`}>
                    {status.type === 'success' ? <Check className="w-5 h-5 shrink-0 mt-0.5" /> : <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />}
                    <div className="leading-relaxed">{status.message}</div>
                </div>
            )}
        </GlassCard>
    );
}
