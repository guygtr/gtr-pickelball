"use client";

import { useState } from "react";
import { X, Trophy, Minus } from "lucide-react";
import { GlassCard } from "@/components/ui/gtr/glass-card";
import { updateMatchResult } from "@/actions/matches";
import { useRouter } from "next/navigation";

interface Player {
  id: string;
  firstName: string;
  lastName: string;
}

interface Match {
  id: string;
  data: {
    team1: string[];
    team2: string[];
    winner?: number; // 1, 2, or 0 (draw)
  };
}

export function ResultModal({ 
  isOpen, 
  onClose, 
  match,
  leaguePlayers
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  match: Match | null;
  leaguePlayers: Player[];
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  if (!isOpen || !match) return null;

  const team1Names = match.data.team1.map(id => {
    const p = leaguePlayers.find(lp => lp.id === id);
    return p ? `${p.firstName} ${p.lastName}` : "Inconnu";
  });

  const team2Names = match.data.team2.map(id => {
    const p = leaguePlayers.find(lp => lp.id === id);
    return p ? `${p.firstName} ${p.lastName}` : "Inconnu";
  });

  async function handleSetWinner(winner: number) {
    setLoading(true);
    try {
      const result = await updateMatchResult(match!.id, winner);
      if (result.success) {
        router.refresh();
        onClose();
      } else {
        alert(result.error || "Erreur lors de la mise à jour");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <GlassCard className="w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-300 border-pickle-orange/30">
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-pickle-orange" />
            Résultat du Match
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-8 space-y-8">
          <div className="text-center space-y-2">
            <p className="text-pickle-orange font-bold text-sm uppercase tracking-widest">Étape de Saisie</p>
            <h4 className="text-white text-lg font-medium italic">&quot;Qui a remporté la victoire ?&quot;</h4>
            <p className="text-slate-500 text-xs">Sélectionnez l&apos;équipe gagnante pour enregistrer le résultat.</p>
          </div>

          <div className="flex items-stretch gap-4">
            {/* Team 1 */}
            <button 
              onClick={() => handleSetWinner(1)}
              disabled={loading}
              className={`flex-1 p-6 rounded-2xl border-2 transition-all group flex flex-col items-center justify-center gap-3 ${
                match.data.winner === 1 
                  ? "bg-pickle-orange/20 border-pickle-orange shadow-[0_0_30px_rgba(251,146,60,0.2)]" 
                  : "bg-white/5 border-white/5 hover:border-white/20 active:scale-95"
              }`}
            >
              <div className="space-y-1 text-center">
                {team1Names.map((name, i) => (
                  <div key={i} className="font-bold text-white text-sm">{name}</div>
                ))}
              </div>
              <div className={`mt-2 py-1 px-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                match.data.winner === 1 ? "bg-pickle-orange text-white" : "bg-white/10 text-slate-500 group-hover:text-slate-300"
              }`}>
                {match.data.winner === 1 ? "Gagnant 👑" : "Équipe 1"}
              </div>
            </button>

            <div className="flex flex-col items-center justify-center px-4">
                <div className="text-2xl font-black text-pickle-blue italic">VS</div>
            </div>

            {/* Team 2 */}
            <button 
              onClick={() => handleSetWinner(2)}
              disabled={loading}
              className={`flex-1 p-6 rounded-2xl border-2 transition-all group flex flex-col items-center justify-center gap-3 ${
                match.data.winner === 2 
                  ? "bg-pickle-orange/20 border-pickle-orange shadow-[0_0_30px_rgba(251,146,60,0.2)]" 
                  : "bg-white/5 border-white/5 hover:border-white/20 active:scale-95"
              }`}
            >
              <div className="space-y-1 text-center">
                {team2Names.map((name, i) => (
                  <div key={i} className="font-bold text-white text-sm">{name}</div>
                ))}
              </div>
              <div className={`mt-2 py-1 px-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                match.data.winner === 2 ? "bg-pickle-orange text-white" : "bg-white/10 text-slate-500 group-hover:text-slate-300"
              }`}>
                {match.data.winner === 2 ? "Gagnant 👑" : "Équipe 2"}
              </div>
            </button>
          </div>

          <div className="flex flex-col gap-3">
             <button
              onClick={() => handleSetWinner(0)}
              disabled={loading}
              className={`w-full py-3 rounded-xl border font-bold text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 ${
                match.data.winner === 0 
                  ? "bg-white/10 border-white/30 text-white" 
                  : "bg-transparent border-white/5 text-slate-500 hover:text-slate-300 hover:border-white/10"
              }`}
            >
              <Minus className="w-4 h-4" />
              Match Nul
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2 text-slate-600 hover:text-slate-400 font-bold text-[10px] uppercase tracking-widest transition-all"
            >
              Annuler
            </button>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
