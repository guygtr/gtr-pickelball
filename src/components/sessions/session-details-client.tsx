import { useState } from "react";
import { Users, Play, CheckCircle2, Circle, Trophy, Trash2, Lock, Unlock } from "lucide-react";
import { GlassCard } from "@/components/ui/gtr/glass-card";
import { NeonButton } from "@/components/ui/gtr/neon-button";
import { toggleAttendance, generateMatches, deleteMatch, deleteAllMatches, toggleRoundStatus } from "@/actions/matchmaking";
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
  settings?: any;
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
              className="w-full" 
              variant="green"
              disabled={presentCount < 2 || loading}
              onClick={handleGenerateMatches}
            >
              <Play className="w-4 h-4 mr-2" />
              {loading ? "Génération..." : "Lancer le Matchmaking"}
            </NeonButton>
            <p className="text-[10px] text-center text-slate-500 mt-4 uppercase font-bold tracking-widest">
              Algorithme Fair Play GTR v2.1
            </p>
          </div>
        </GlassCard>
      </div>

      {/* Liste des Matchs */}
      <div className="lg:col-span-2 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h3 className="text-2xl font-black text-white flex items-center gap-3">
            <Trophy className="w-6 h-6 text-pickle-orange" />
            MATCHS DE LA SESSION
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
          <GlassCard className="p-12 text-center border-dashed">
            <div className="bg-white/5 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Play className="w-8 h-8 text-slate-600" />
            </div>
            <h4 className="text-xl font-bold text-slate-300">Aucun match généré</h4>
            <p className="text-slate-500 mt-2 max-w-sm mx-auto">
                Sélectionnez les joueurs présents et cliquez sur &quot;Lancer le Matchmaking&quot; pour organiser les terrains.
            </p>
          </GlassCard>
        ) : (
          <div className="space-y-12">
            {Array.from({ length: Math.ceil(initialMatches.length / Math.max(1, courtCount)) }).map((_, roundIdx) => {
              const roundMatches = initialMatches.slice(roundIdx * courtCount, (roundIdx + 1) * courtCount);
              const isRoundClosed = closedRounds.includes(roundIdx);
              const gridCols = courtCount === 2 ? 'md:grid-cols-2' : courtCount >= 3 ? 'lg:grid-cols-3' : 'md:grid-cols-2';
              
              return (
                <div key={roundIdx} className={`space-y-6 transition-all duration-500 ${isRoundClosed ? 'opacity-60 grayscale-[0.5]' : ''}`}>
                  <div className="flex items-center gap-4">
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-pickle-green/20 to-transparent" />
                    <div className="flex flex-col items-center">
                      <span className="text-xs font-black text-pickle-green uppercase tracking-[0.3em] mb-1">
                        TEMPS DE JEU
                      </span>
                      <div className="flex items-center gap-3">
                        <span className={`text-sm font-black text-white uppercase tracking-[0.2em] px-6 py-1.5 rounded-full border transition-all duration-300 ${
                          isRoundClosed 
                            ? 'bg-slate-800 border-white/10 text-slate-400' 
                            : 'bg-pickle-green/10 border-pickle-green/30 shadow-[0_0_15px_rgba(132,204,22,0.1)]'
                        }`}>
                          RONDE {roundIdx + 1}
                        </span>
                        <button
                          onClick={() => handleToggleRoundStatus(roundIdx, !isRoundClosed)}
                          className={`p-1.5 rounded-lg border transition-all ${
                            isRoundClosed 
                              ? 'bg-red-500/10 border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white' 
                              : 'bg-pickle-green/10 border-pickle-green/30 text-pickle-green hover:bg-pickle-green hover:text-white'
                          }`}
                          title={isRoundClosed ? "Ouvrir la ronde" : "Fermer la ronde"}
                        >
                          {isRoundClosed ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-pickle-green/20 to-transparent" />
                  </div>

                  <div className={`grid grid-cols-1 gap-6 ${gridCols}`}>
                    {roundMatches.map((match, idx) => {
                      const globalIdx = roundIdx * courtCount + idx;
                      const hasWinner = match.data.winner !== undefined && match.data.winner !== null;
                      
                      return (
                        <GlassCard 
                          key={match.id} 
                          className={`overflow-hidden group hover:border-pickle-green/50 transition-all duration-500 hover:shadow-2xl hover:shadow-pickle-green/5 ${
                            hasWinner ? 'ring-1 ring-pickle-green/30' : ''
                          } ${isRoundClosed ? 'pointer-events-none' : ''}`}
                        >
                          <div className="bg-white/5 p-4 border-b border-white/5 flex justify-between items-center">
                              <span className="text-sm font-black text-pickle-green uppercase tracking-wider flex items-center gap-2">
                                  <div className={`w-2 h-2 rounded-full ${isRoundClosed ? 'bg-slate-600' : 'bg-pickle-green animate-pulse'}`} />
                                  {match.court?.name || `TERRAIN ${idx + 1}`}
                              </span>
                              <div className="flex items-center gap-3">
                                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded-md">
                                    MATCH #{globalIdx + 1}
                                  </span>
                                  {!isRoundClosed && (
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleDeleteMatch(match.id); }}
                                        className="p-1 text-slate-600 hover:text-red-500 transition-colors"
                                        title="Supprimer le match"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                              </div>
                          </div>
                          
                          <div className="p-6 space-y-6">
                              <div className="flex items-center justify-between gap-6 relative">
                                  {/* Team 1 */}
                                  <div className={`flex-1 space-y-2 transition-all duration-500 ${match.data.winner === 1 ? 'scale-105' : match.data.winner === 2 ? 'opacity-30 grayscale' : ''}`}>
                                      {match.data.team1.map((pId: string) => {
                                          const p = leaguePlayers.find(lp => lp.id === pId);
                                          return (
                                            <div key={pId} className="flex items-center gap-2.5">
                                              <div className={`w-1.5 h-4 rounded-full shrink-0 ${match.data.winner === 1 ? 'bg-pickle-green' : 'bg-white/10'}`} />
                                              <div className="text-base font-bold text-white truncate">{p?.firstName} {p?.lastName}</div>
                                            </div>
                                          )
                                      })}
                                  </div>

                                  {/* VS Indicator */}
                                  <div className="flex flex-col items-center justify-center shrink-0">
                                    <div className="h-8 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent" />
                                    <div className={`text-xs font-black italic p-2 rounded-full border transition-all duration-700 ${
                                      hasWinner 
                                        ? 'bg-pickle-green/5 border-pickle-green/20 text-pickle-green/40' 
                                        : 'bg-white/5 border-white/10 text-pickle-blue'
                                    }`}>
                                      VS
                                    </div>
                                    <div className="h-8 w-px bg-gradient-to-t from-transparent via-white/10 to-transparent" />
                                  </div>

                                  {/* Team 2 */}
                                  <div className={`flex-1 space-y-2 text-right transition-all duration-500 ${match.data.winner === 2 ? 'scale-105' : match.data.winner === 1 ? 'opacity-30 grayscale' : ''}`}>
                                      {match.data.team2.map((pId: string) => {
                                          const p = leaguePlayers.find(lp => lp.id === pId);
                                          return (
                                            <div key={pId} className="flex items-center justify-end gap-2.5">
                                              <div className="text-base font-bold text-white truncate">{p?.firstName} {p?.lastName}</div>
                                              <div className={`w-1.5 h-4 rounded-full shrink-0 ${match.data.winner === 2 ? 'bg-pickle-green' : 'bg-white/10'}`} />
                                            </div>
                                          )
                                      })}
                                  </div>

                                  {/* Winner Icon Overlay */}
                                  {hasWinner && (
                                    <div className={`absolute top-1/2 -translate-y-1/2 ${match.data.winner === 1 ? 'left-0' : 'right-0'} opacity-20 pointer-events-none`}>
                                      <Trophy className="w-12 h-12 text-pickle-green" />
                                    </div>
                                  )}
                              </div>
                          </div>

                          <div className={`bg-white/5 p-3 text-center border-t border-white/5 ${!isRoundClosed ? 'group-hover:bg-pickle-green/10' : ''} transition-all duration-300`}>
                              <button 
                                onClick={() => !isRoundClosed && setSelectedMatch(match)}
                                disabled={isRoundClosed}
                                className={`text-xs font-black uppercase tracking-[0.2em] w-full flex items-center justify-center gap-2 ${
                                  isRoundClosed ? 'text-slate-600' : 'text-pickle-green'
                                }`}
                              >
                                  {hasWinner ? (
                                    <>
                                      <CheckCircle2 className="w-3 h-3" />
                                      {isRoundClosed ? "RÉSULTAT VERROUILLÉ" : "MODIFIER RÉSULTAT"}
                                    </>
                                  ) : (
                                    <>
                                      <Trophy className="w-3 h-3" />
                                      {isRoundClosed ? "MATCH FERMÉ" : "SAISIR RÉSULTAT"}
                                    </>
                                  )}
                              </button>
                          </div>
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
