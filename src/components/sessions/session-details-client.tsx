"use client";

import { useState } from "react";
import { Users, Play, CheckCircle2, Circle, Trophy, Trash2 } from "lucide-react";
import { GlassCard } from "@/components/ui/gtr/glass-card";
import { NeonButton } from "@/components/ui/gtr/neon-button";
import { toggleAttendance, generateMatches, deleteMatch, deleteAllMatches } from "@/actions/matchmaking";
import { useRouter } from "next/navigation";

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
  };
}

interface Session {
  id: string;
}

export function SessionDetailsClient({ 
  session, 
  leaguePlayers, 
  initialAttendances,
  initialMatches 
}: { 
  session: Session; 
  leaguePlayers: Player[]; 
  initialAttendances: Attendance[];
  initialMatches: Match[];
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const attendancesMap = new Map(initialAttendances.map(a => [a.playerId, a.isPresent]));

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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {initialMatches.map((match, idx) => (
              <GlassCard key={match.id} className="overflow-hidden group hover:border-pickle-orange/50 transition-colors">
                <div className="bg-white/5 p-3 border-b border-white/5 flex justify-between items-center">
                    <span className="text-xs font-black text-pickle-orange uppercase tracking-tighter">
                        {match.court?.name || `Terrain ${idx + 1}`}
                    </span>
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] text-slate-500 font-bold uppercase">Match #{idx + 1}</span>
                        <button 
                            onClick={(e) => { e.stopPropagation(); handleDeleteMatch(match.id); }}
                            className="p-1 text-slate-600 hover:text-red-500 transition-colors"
                            title="Supprimer le match"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
                <div className="p-4 space-y-4">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 space-y-1">
                            {match.data.team1.map((pId: string) => {
                                const p = leaguePlayers.find(lp => lp.id === pId);
                                return <div key={pId} className="text-sm font-bold text-white truncate">{p?.firstName} {p?.lastName}</div>
                            })}
                        </div>
                        <div className="text-xl font-black text-pickle-blue italic">VS</div>
                        <div className="flex-1 space-y-1 text-right">
                            {match.data.team2.map((pId: string) => {
                                const p = leaguePlayers.find(lp => lp.id === pId);
                                return <div key={pId} className="text-sm font-bold text-white truncate">{p?.firstName} {p?.lastName}</div>
                            })}
                        </div>
                    </div>
                </div>
                <div className="bg-pickle-orange/5 p-2 text-center border-t border-pickle-orange/10 group-hover:bg-pickle-orange/10 transition-colors">
                    <button className="text-[10px] font-black text-pickle-orange uppercase tracking-widest">
                        Saisir le Score
                    </button>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
