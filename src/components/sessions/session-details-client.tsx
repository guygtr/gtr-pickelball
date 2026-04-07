"use client";

import { useState } from "react";
import { Users, Play, CheckCircle2, Circle, Trophy, Trash2, Lock, Unlock } from "lucide-react";
import { GlassCard } from "@/components/ui/gtr/glass-card";
import { NeonButton } from "@/components/ui/gtr/neon-button";
import { toggleAttendance, generateMatches, deleteMatch, deleteAllMatches, toggleRoundStatus } from "@/actions/matches";
import { useRouter } from "next/navigation";
import { ResultModal } from "@/components/matches/result-modal";

interface Player {
  id: string;
  firstName: string;
  lastName: string;
  skillLevel: number;
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
  courtCount 
}: { 
  session: Session; 
  leaguePlayers: Player[]; 
  initialAttendances: Attendance[];
  initialMatches: Match[];
  courtCount: number;
}) {
  const [loading, setLoading] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const router = useRouter();

  const attendancesMap = new Map(initialAttendances.map(a => [a.playerId, a.isPresent]));
  const closedRounds = (session.settings as { closedRounds?: number[] })?.closedRounds || [];

  async function handleToggleAttendance(playerId: string, currentStatus: boolean) {
    try {
      await toggleAttendance(session.id, playerId, !currentStatus);
      router.refresh();
    } catch (error) {
      console.error(error);
    }
  }

  async function handleGenerateMatches() {
    setLoading(true);
    try {
      await generateMatches(session.id);
      router.refresh();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleRoundStatus(roundIdx: number, isClosed: boolean) {
    try {
      await toggleRoundStatus(session.id, roundIdx, isClosed);
      router.refresh();
    } catch (error) {
      console.error(error);
    }
  }

  async function handleDeleteMatch(matchId: string) {
    if (!confirm("Supprimer ce match ?")) return;
    try {
      await deleteMatch(matchId);
      router.refresh();
    } catch (error) {
      console.error(error);
    }
  }

  async function handleDeleteAllMatches() {
    if (!confirm("⚠️ ATTENTION : Voulez-vous supprimer TOUS les matchs de cette session ? Cette action est irréversible.")) return;
    setLoading(true);
    try {
      await deleteAllMatches(session.id);
      router.refresh();
    } catch (error) {
      console.error(error);
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
              <Users className="w-5 h-5 text-pickle-green" />
              Présences ({presentCount}/{leaguePlayers.length})
            </h3>
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {leaguePlayers.map((player) => {
              const isPresent = attendancesMap.get(player.id) ?? false;
              return (
                <button
                  key={player.id}
                  onClick={() => handleToggleAttendance(player.id, isPresent)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                    isPresent 
                      ? 'bg-pickle-green/10 border-pickle-green/30 text-white' 
                      : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'
                  }`}
                >
                  <div className="flex flex-col items-start">
                    <span className="font-bold">{player.firstName} {player.lastName}</span>
                    <span className="text-xs opacity-60">Niveau: {player.skillLevel.toFixed(1)}</span>
                  </div>
                  {isPresent ? (
                    <CheckCircle2 className="w-5 h-5 text-pickle-green" />
                  ) : (
                    <Circle className="w-5 h-5 opacity-20" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-6 pt-6 border-t border-white/5">
            <NeonButton 
              className="w-full py-5 text-[12px] tracking-[0.25em]" 
              variant="green"
              disabled={presentCount < 2 || loading}
              onClick={handleGenerateMatches}
            >
              <Play className="w-5 h-5 flex-shrink-0" />
              {loading ? "GÉNÉRATION..." : "GÉNÉRER LES PARTIES"}
            </NeonButton>
            <p className="text-[9px] text-center text-slate-500 mt-4 uppercase font-bold tracking-[0.3em] opacity-40">
              GTR FAIR PLAY ENGINE v2.2
            </p>
          </div>
        </GlassCard>
      </div>

      {/* Liste des Matchs */}
      <div className="lg:col-span-2 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h3 className="text-2xl font-black text-white flex items-center gap-3">
            <Trophy className="w-6 h-6 text-pickle-orange" />
            {"VUE D'ENSEMBLE DES MATCHS"}
          </h3>

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
                          : 'bg-pickle-green/10 border-pickle-green/30 text-pickle-green shadow-[0_0_20px_rgba(132,204,22,0.15)]'
                      }`}>
                        RONDE {roundIdx + 1}
                      </div>
                      <button
                        onClick={() => handleToggleRoundStatus(roundIdx, !isRoundClosed)}
                        className={`p-2 rounded-full border transition-all duration-300 ${
                          isRoundClosed 
                            ? 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500 hover:text-white' 
                            : 'bg-white/5 border-white/10 text-slate-500 hover:border-pickle-blue/50 hover:text-pickle-blue'
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
                              ? 'border-pickle-green/30 bg-pickle-green/[0.03] shadow-[0_0_40px_rgba(132,204,22,0.05)]' 
                              : 'hover:border-white/20'
                          } ${isRoundClosed ? 'grayscale-[0.2] pointer-events-none' : ''}`}
                        >
                          {/* Header du Match */}
                          <div className="px-5 py-3 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${isRoundClosed ? 'bg-slate-600' : 'bg-pickle-green shadow-[0_0_8px_rgba(132,204,22,0.5)]'}`} />
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
                                      <div className={`w-1 h-6 rounded-full shrink-0 ${match.data.winner === 1 ? 'bg-pickle-green shadow-[0_0_10px_rgba(132,204,22,0.5)]' : 'bg-white/5'}`} />
                                      <div className="text-sm font-extrabold text-white leading-tight">{p?.firstName} <br/> <span className="text-slate-400 font-medium truncate inline-block max-w-[100px]">{p?.lastName}</span></div>
                                    </div>
                                  )
                                })}
                                {match.data.winner === 1 && (
                                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-pickle-green/20 border border-pickle-green/30 rounded-md mt-2">
                                    <Trophy className="w-3 h-3 text-pickle-green" />
                                    <span className="text-[8px] font-black text-pickle-green uppercase tracking-tighter">Vainqueur</span>
                                  </div>
                                )}
                              </div>

                              {/* VS Middle */}
                              <div className="flex flex-col items-center gap-2">
                                <div className="h-4 w-[1px] bg-white/5" />
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[9px] font-black border transition-all duration-700 ${
                                  hasWinner 
                                    ? 'bg-slate-900/80 border-white/5 text-slate-700' 
                                    : 'bg-white/5 border-white/10 text-slate-500 group-hover:border-pickle-blue group-hover:text-pickle-blue group-hover:shadow-[0_0_15px_rgba(59,130,246,0.3)]'
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
                                      <div className={`w-1 h-6 rounded-full shrink-0 ${match.data.winner === 2 ? 'bg-pickle-green shadow-[0_0_10px_rgba(132,204,22,0.5)]' : 'bg-white/5'}`} />
                                    </div>
                                  )
                                })}
                                {match.data.winner === 2 && (
                                  <div className="inline-flex items-center justify-end gap-1.5 px-2 py-0.5 bg-pickle-green/20 border border-pickle-green/30 rounded-md mt-2 ml-auto">
                                    <span className="text-[8px] font-black text-pickle-green uppercase tracking-tighter">Vainqueur</span>
                                    <Trophy className="w-3 h-3 text-pickle-green" />
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
                                  ? 'bg-pickle-green/5 text-pickle-green hover:bg-pickle-green hover:text-black'
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
