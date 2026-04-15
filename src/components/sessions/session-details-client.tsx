"use client";

import { useState } from "react";
import { Users, Play, CheckCircle2, Circle, Trophy, Trash2, Lock, Unlock } from "lucide-react";
import { GlassCard } from "@/components/ui/gtr/glass-card";
import { NeonButton } from "@/components/ui/gtr/neon-button";
import { toggleAttendance, generateMatches, deleteMatch, deleteAllMatches, toggleRoundStatus } from "@/actions/matches";
import { terminateSession } from "@/actions/sessions";
import { useRouter } from "next/navigation";
import { ResultModal } from "@/components/matches/result-modal";
import { AiRecapCard } from "./AiRecapCard";
import toast from "react-hot-toast";

interface Player {
  id: string;
  firstName: string;
  lastName: string;
  skillLevel: number;
  type: "permanent" | "remplacant";
}

interface Attendance {
  playerId: string;
  isPresent: boolean;
}

interface Match {
  id: string;
  courtId: string | null;
  court: { name: string } | null;
  data: {
    team1: string[];
    team2: string[];
    winner?: number; // 1, 2, or 0 (draw)
    status?: string;
  };
}

interface Session {
  id: string;
  settings?: Record<string, unknown>;
}

export function SessionDetailsClient({ 
  session, 
  leaguePlayers, 
  initialAttendances,
  initialMatches,
  courtCount,
  statusLabel
}: { 
  session: Session; 
  leaguePlayers: Player[]; 
  initialAttendances: Attendance[];
  initialMatches: Match[];
  courtCount: number;
  statusLabel: string;
}) {
  const [loading, setLoading] = useState(false);
  const [generationMode, setGenerationMode] = useState<"RANDOM" | "COMPETITIVE">("COMPETITIVE");
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const router = useRouter();

  const attendancesMap = new Map(initialAttendances.map(a => [a.playerId, a.isPresent]));
  const closedRounds = (session.settings as { closedRounds?: number[] })?.closedRounds || [];

  async function handleToggleAttendance(playerId: string, currentStatus: boolean) {
    const action = currentStatus ? "Suppression de la présence..." : "Marquage de la présence...";
    const loadingToast = toast.loading(action);
    try {
      const result = await toggleAttendance({ sessionId: session.id, playerId, isPresent: !currentStatus });
      if (result.success) {
        toast.success(currentStatus ? "Joueur absent" : "Joueur présent", { id: loadingToast });
        router.refresh();
      } else {
        toast.error(result.error || "Erreur lors de la mise à jour", { id: loadingToast });
      }
    } catch (error) {
      console.error(error);
      toast.error("Erreur technique de présence", { id: loadingToast });
    }
  }

  async function handleGenerateMatches() {
    setLoading(true);
    const modeLabel = generationMode === "RANDOM" ? "Aléatoire" : "Compétition";
    const loadingToast = toast.loading(`Calcul des matchs (${modeLabel})...`);
    try {
      const result = await generateMatches(session.id, generationMode);
      if (result.success) {
        toast.success("Matchs générés avec succès !", { id: loadingToast });
        router.refresh();
      } else {
        toast.error(result.error || "Échec de la génération", { id: loadingToast });
      }
    } catch (error) {
      console.error(error);
      toast.error("Erreur technique lors de la génération", { id: loadingToast });
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleRoundStatus(roundIdx: number, isClosed: boolean) {
    const loadingToast = toast.loading(isClosed ? "Verrouillage de la ronde..." : "Déverrouillage...");
    try {
      const result = await toggleRoundStatus({ sessionId: session.id, roundIdx, isClosed });
      if (result.success) {
        toast.success(isClosed ? "Ronde verrouillée" : "Ronde déverrouillée", { id: loadingToast });
        router.refresh();
      } else {
        toast.error(result.error || "Erreur de verrouillage", { id: loadingToast });
      }
    } catch (error) {
      console.error(error);
      toast.error("Erreur technique de verrouillage", { id: loadingToast });
    }
  }

  async function handleDeleteMatch(matchId: string) {
    if (!confirm("Supprimer ce match ?")) return;
    const loadingToast = toast.loading("Suppression du match...");
    try {
      const result = await deleteMatch(matchId);
      if (result.success) {
        toast.success("Match supprimé", { id: loadingToast });
        router.refresh();
      } else {
        toast.error(result.error || "Erreur lors de la suppression", { id: loadingToast });
      }
    } catch (error) {
      console.error(error);
      toast.error("Erreur technique de suppression", { id: loadingToast });
    }
  }

  async function handleDeleteAllMatches() {
    if (!confirm("⚠️ ATTENTION : Voulez-vous supprimer TOUS les matchs de cette session ? Cette action est irréversible.")) return;
    setLoading(true);
    const loadingToast = toast.loading("Nettoyage complet de la session...");
    try {
      const result = await deleteAllMatches(session.id);
      if (result.success) {
        toast.success("Tous les matchs ont été supprimés", { id: loadingToast });
        router.refresh();
      } else {
        toast.error(result.error || "Erreur lors du nettoyage", { id: loadingToast });
      }
    } catch (error) {
      console.error(error);
      toast.error("Erreur technique de nettoyage", { id: loadingToast });
    } finally {
      setLoading(false);
    }
  }

  async function handleTerminateSession() {
    if (!confirm("Voulez-vous vraiment terminer cette session ?\n\nCela empêchera la génération de nouvelles parties.")) return;
    setLoading(true);
    const loadingToast = toast.loading("Fermeture de la session...");
    try {
      const result = await terminateSession(session.id);
      if (result.success) {
        toast.success("Session terminée avec succès", { id: loadingToast });
        router.refresh();
      } else {
        toast.error(result.error || "Erreur de fermeture", { id: loadingToast });
      }
    } catch (error) {
      console.error(error);
      toast.error("Erreur technique", { id: loadingToast });
    } finally {
      setLoading(false);
    }
  }

  const presentCount = initialAttendances.filter(a => a.isPresent).length;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Liste des Présences */}
      <div className="lg:col-span-1 space-y-6">
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-pickle-primary" />
              Présences ({presentCount}/{leaguePlayers.length})
            </h3>
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {(() => {
              const permanents = leaguePlayers
                .filter(p => p.type === 'permanent')
                .sort((a, b) => (a.firstName + ' ' + a.lastName).localeCompare(b.firstName + ' ' + b.lastName));
              
              const replacements = leaguePlayers
                .filter(p => p.type === 'remplacant')
                .sort((a, b) => (a.firstName + ' ' + a.lastName).localeCompare(b.firstName + ' ' + b.lastName));

              const renderPlayer = (player: Player) => {
                const isPresent = attendancesMap.get(player.id) ?? false;
                return (
                  <button
                    key={player.id}
                    onClick={() => handleToggleAttendance(player.id, isPresent)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                      isPresent 
                        ? 'bg-pickle-primary/10 border-pickle-primary/30 text-white' 
                        : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex flex-col items-start text-left">
                      <span className="font-bold flex items-center gap-2">
                        {player.firstName} {player.lastName}
                        <span className={`w-1.5 h-1.5 rounded-full ${player.type === 'permanent' ? 'bg-pickle-secondary' : 'bg-pickle-muted'}`} />
                      </span>
                      <span className="text-[9px] opacity-60 uppercase tracking-widest leading-none mt-1">
                        LEVEL {player.skillLevel.toFixed(1)} • {player.type}
                      </span>
                    </div>
                    {isPresent ? (
                      <CheckCircle2 className="w-5 h-5 text-pickle-primary" />
                    ) : (
                      <Circle className="w-5 h-5 opacity-10" />
                    )}
                  </button>
                );
              };

              return (
                <div className="space-y-6">
                  {permanents.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-[10px] font-black text-pickle-secondary uppercase tracking-[0.2em] px-1 opacity-80 flex items-center gap-2">
                        <div className="w-1 h-3 bg-pickle-secondary rounded-full" />
                        Permanents
                      </h4>
                      <div className="space-y-1.5">
                        {permanents.map(renderPlayer)}
                      </div>
                    </div>
                  )}
                  
                  {replacements.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-[10px] font-black text-pickle-muted uppercase tracking-[0.2em] px-1 opacity-80 flex items-center gap-2">
                        <div className="w-1 h-3 bg-pickle-muted rounded-full" />
                        Remplaçants
                      </h4>
                      <div className="space-y-1.5">
                        {replacements.map(renderPlayer)}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>

          <div className="mt-6 pt-6 border-t border-white/5">
            {/* Mode Selector */}
            <div className="mb-6 space-y-3">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-1 opacity-60">
                Mode de Matchmaking
              </label>
              <div className="grid grid-cols-2 gap-2 bg-black/20 p-1 rounded-2xl border border-white/5">
                <button 
                  onClick={() => setGenerationMode("RANDOM")}
                  className={`py-2.5 rounded-xl text-[10px] font-black transition-all duration-300 tracking-widest ${
                    generationMode === "RANDOM" 
                      ? "bg-pickle-secondary/20 text-pickle-secondary shadow-[0_0_15px_rgba(59,130,246,0.15)]" 
                      : "text-slate-600 hover:text-slate-400"
                  }`}
                >
                  ALÉATOIRE
                </button>
                <button 
                  onClick={() => setGenerationMode("COMPETITIVE")}
                  className={`py-2.5 rounded-xl text-[10px] font-black transition-all duration-300 tracking-widest ${
                    generationMode === "COMPETITIVE" 
                      ? "bg-pickle-muted/20 text-pickle-muted shadow-[0_0_15px_rgba(249,115,22,0.15)]" 
                      : "text-slate-600 hover:text-slate-400"
                  }`}
                >
                  COMPÉTITION
                </button>
              </div>
            </div>

            <NeonButton 
              className="w-full py-5 text-[12px] tracking-[0.25em]" 
              variant={generationMode === "COMPETITIVE" ? "muted" : "primary"}
              disabled={presentCount < 2 || loading || statusLabel === "Terminé"}
              onClick={handleGenerateMatches}
            >
              <Play className="w-5 h-5 flex-shrink-0" />
              {statusLabel === "Terminé" ? "SESSION TERMINÉE" : loading ? "GÉNÉRATION..." : "GÉNÉRER LES PARTIES"}
            </NeonButton>
            <p className="text-[9px] text-center text-slate-500 mt-4 uppercase font-bold tracking-[0.3em] opacity-40">
              GTR FAIR PLAY ENGINE v2.5
            </p>
          </div>
        </GlassCard>
      </div>

      {/* Liste des Matchs */}
      <div className="lg:col-span-2 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h3 className="text-2xl font-black text-white flex items-center gap-3">
            <Trophy className="w-6 h-6 text-pickle-muted" />
            {"VUE D'ENSEMBLE DES MATCHS"}
          </h3>

          <div className="flex items-center gap-2">
            {statusLabel !== "Terminé" && initialMatches.length > 0 && (
              <button
                onClick={handleTerminateSession}
                disabled={loading}
                className="flex items-center gap-2 px-3 py-1.5 text-[10px] font-black text-pickle-primary hover:text-black border border-pickle-primary/30 hover:bg-pickle-primary rounded-lg transition-all uppercase tracking-widest disabled:opacity-50"
              >
                <CheckCircle2 className="w-3 h-3" />
                Terminer
              </button>
            )}

            {initialMatches.length > 0 && (
              <button
                  onClick={handleDeleteAllMatches}
                  disabled={loading}
                  className="flex items-center gap-2 px-3 py-1.5 text-[10px] font-black text-red-500 hover:text-white border border-red-500/30 hover:bg-red-500 rounded-lg transition-all uppercase tracking-widest disabled:opacity-50"
              >
                  <Trash2 className="w-3 h-3" />
                  Tout supprimer
              </button>
            )}
          </div>
        </div>

        {/* GTR SMART RECAP (IA) */}
        {(statusLabel === "Terminé" || (session.settings as any)?.aiRecap) && (
          <AiRecapCard 
            sessionId={session.id} 
            initialRecap={(session.settings as any)?.aiRecap}
            isCompleted={statusLabel === "Terminé"}
          />
        )}

        {initialMatches.length === 0 ? (
          <GlassCard className="p-16 text-center border-dashed border-white/5">
            <div className="bg-white/5 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Play className="w-10 h-10 text-slate-700" />
            </div>
            <h4 className="text-xl font-bold text-slate-300">Aucune partie générée</h4>
            <p className="text-slate-500 mt-4 max-w-sm mx-auto text-sm leading-relaxed">
                Sélectionnez les joueurs présents et cliquez sur &quot;GÉNÉRER LES PARTIES&quot; pour organiser les rencontres sur les terrains.
            </p>
          </GlassCard>
        ) : (
          <div className="space-y-12">
            {Array.from({ length: Math.ceil(initialMatches.length / Math.max(1, courtCount)) }).map((_, roundIdx) => {
              const roundMatches = initialMatches.slice(roundIdx * courtCount, (roundIdx + 1) * courtCount);
              const isRoundClosed = closedRounds.includes(roundIdx);
              const gridCols = courtCount === 2 ? 'md:grid-cols-2' : courtCount >= 3 ? 'lg:grid-cols-3' : 'md:grid-cols-2';
              
              return (
                <div key={roundIdx} className={`space-y-8 transition-all duration-700 ${isRoundClosed ? 'opacity-95' : ''}`}>
                  <div className="flex items-center gap-4">
                    <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                    <div className="flex items-center gap-3">
                      <div className={`px-6 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-[0.3em] backdrop-blur-md transition-all duration-500 ${
                        isRoundClosed 
                          ? 'bg-slate-900/40 border-white/5 text-slate-600' 
                          : 'bg-pickle-primary/10 border-pickle-primary/30 text-pickle-primary shadow-[0_0_20px_rgba(132,204,22,0.15)]'
                      }`}>
                        RONDE {roundIdx + 1}
                      </div>
                      <button
                        onClick={() => handleToggleRoundStatus(roundIdx, !isRoundClosed)}
                        className={`p-2 rounded-full border transition-all duration-300 ${
                          isRoundClosed 
                            ? 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500 hover:text-white' 
                            : 'bg-white/5 border-white/10 text-slate-500 hover:border-pickle-secondary/50 hover:text-pickle-secondary'
                        }`}
                        title={isRoundClosed ? "Réactiver la ronde" : "Verrouiller la ronde"}
                      >
                        {isRoundClosed ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                  </div>

                  <div className={`grid grid-cols-1 gap-6 ${gridCols}`}>
                    {roundMatches.map((match, idx) => {
                      const globalIdx = roundIdx * courtCount + idx;
                      const hasWinner = match.data.winner !== undefined && match.data.winner !== null;
                      
                      return (
                        <GlassCard 
                          key={match.id} 
                          className={`group relative overflow-hidden transition-all duration-700 backdrop-blur-2xl ${
                            hasWinner 
                              ? 'border-pickle-primary/30 bg-pickle-primary/[0.03] shadow-[0_0_40px_rgba(132,204,22,0.05)]' 
                              : 'hover:border-white/20'
                          } ${isRoundClosed ? 'grayscale-[0.2] pointer-events-none' : ''}`}
                        >
                          {/* Header du Match */}
                          <div className="px-5 py-3 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${isRoundClosed ? 'bg-slate-600' : 'bg-pickle-primary shadow-[0_0_8px_rgba(132,204,22,0.5)]'}`} />
                              <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                                {match.court?.name || `TERRAIN ${idx + 1}`}
                              </span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-[9px] text-slate-600 font-bold uppercase tracking-widest border border-white/5 px-2 py-0.5 rounded-md">
                                #{globalIdx + 1}
                              </span>
                              {!isRoundClosed && (
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleDeleteMatch(match.id); }}
                                  className="p-1 text-slate-700 hover:text-red-500 transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                          
                          {/* Corps du Match */}
                          <div className="p-6 relative">
                            <div className="flex items-center justify-between gap-4">
                              {/* Équipe 1 */}
                              <div className={`flex-1 space-y-3 transition-all duration-500 ${match.data.winner === 1 ? 'scale-[1.02]' : match.data.winner === 2 ? 'opacity-30' : ''}`}>
                                {match.data.team1.map((pId: string) => {
                                  const p = leaguePlayers.find(lp => lp.id === pId);
                                  return (
                                    <div key={pId} className="flex items-center gap-3">
                                      <div className={`w-1 h-6 rounded-full shrink-0 ${match.data.winner === 1 ? 'bg-pickle-primary shadow-[0_0_10px_rgba(132,204,22,0.5)]' : 'bg-white/5'}`} />
                                      <div className="text-sm font-extrabold text-white leading-tight">{p?.firstName} <br/> <span className="text-slate-400 font-medium truncate inline-block max-w-[100px]">{p?.lastName}</span></div>
                                    </div>
                                  )
                                })}
                                {match.data.winner === 1 && (
                                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-pickle-primary/20 border border-pickle-primary/30 rounded-md mt-2">
                                    <Trophy className="w-3 h-3 text-pickle-primary" />
                                    <span className="text-[8px] font-black text-pickle-primary uppercase tracking-tighter">Vainqueur</span>
                                  </div>
                                )}
                              </div>

                              {/* VS Middle */}
                              <div className="flex flex-col items-center gap-2">
                                <div className="h-4 w-[1px] bg-white/5" />
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[9px] font-black border transition-all duration-700 ${
                                  hasWinner 
                                    ? 'bg-slate-900/80 border-white/5 text-slate-700' 
                                    : 'bg-white/5 border-white/10 text-slate-500 group-hover:border-pickle-secondary group-hover:text-pickle-secondary group-hover:shadow-[0_0_15px_rgba(59,130,246,0.3)]'
                                }`}>
                                  VS
                                </div>
                                <div className="h-4 w-[1px] bg-white/5" />
                              </div>

                              {/* Équipe 2 */}
                              <div className={`flex-1 space-y-3 text-right transition-all duration-500 ${match.data.winner === 2 ? 'scale-[1.02]' : match.data.winner === 1 ? 'opacity-30' : ''}`}>
                                {match.data.team2.map((pId: string) => {
                                  const p = leaguePlayers.find(lp => lp.id === pId);
                                  return (
                                    <div key={pId} className="flex items-center justify-end gap-3">
                                      <div className="text-sm font-extrabold text-white leading-tight">{p?.firstName} <br/> <span className="text-slate-400 font-medium truncate inline-block max-w-[100px]">{p?.lastName}</span></div>
                                      <div className={`w-1 h-6 rounded-full shrink-0 ${match.data.winner === 2 ? 'bg-pickle-primary shadow-[0_0_10px_rgba(132,204,22,0.5)]' : 'bg-white/5'}`} />
                                    </div>
                                  )
                                })}
                                {match.data.winner === 2 && (
                                  <div className="inline-flex items-center justify-end gap-1.5 px-2 py-0.5 bg-pickle-primary/20 border border-pickle-primary/30 rounded-md mt-2 ml-auto">
                                    <span className="text-[8px] font-black text-pickle-primary uppercase tracking-tighter">Vainqueur</span>
                                    <Trophy className="w-3 h-3 text-pickle-primary" />
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Footer / Bouton */}
                          <button 
                            onClick={() => !isRoundClosed && setSelectedMatch(match)}
                            disabled={isRoundClosed}
                            className={`w-full py-4 text-[10px] font-black uppercase tracking-[0.2em] border-t border-white/5 transition-all duration-500 flex items-center justify-center gap-2 ${
                              isRoundClosed 
                                ? 'bg-slate-900/20 text-slate-700' 
                                : hasWinner
                                  ? 'bg-pickle-primary/5 text-pickle-primary hover:bg-pickle-primary hover:text-black'
                                  : 'bg-white/[0.02] text-slate-500 hover:bg-white/10 hover:text-white'
                            }`}
                          >
                            {hasWinner ? (
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            ) : (
                              <Play className="w-3.5 h-3.5" />
                            )}
                            {hasWinner ? "MODIFIER RÉSULTAT" : "SAISIR RÉSULTAT"}
                          </button>
                        </GlassCard>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ResultModal 
        isOpen={!!selectedMatch}
        onClose={() => setSelectedMatch(null)}
        match={selectedMatch}
        leaguePlayers={leaguePlayers}
      />
    </div>
  );
}
