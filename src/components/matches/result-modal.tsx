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
    winner?: number;
  };
}

/**
 * Saisie score — Option B : gros boutons tactiles, copy claire.
 */
export function ResultModal({
  isOpen,
  onClose,
  match,
  leaguePlayers,
}: {
  isOpen: boolean;
  onClose: () => void;
  match: Match | null;
  leaguePlayers: Player[];
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  if (!isOpen || !match) return null;

  const team1Names = match.data.team1.map((id) => {
    const p = leaguePlayers.find((lp) => lp.id === id);
    return p ? `${p.firstName} ${p.lastName}` : "Inconnu";
  });

  const team2Names = match.data.team2.map((id) => {
    const p = leaguePlayers.find((lp) => lp.id === id);
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm">
      <GlassCard
        className="w-full max-w-lg overflow-hidden rounded-t-2xl sm:rounded-2xl border-white/10"
        hoverEffect={false}
      >
        <div className="p-4 sm:p-5 border-b border-white/5 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-pickle-muted" />
            Qui a gagné ?
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-white/5"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-4">
          <p className="text-sm text-slate-400 text-center">
            Appuyez sur l&apos;équipe gagnante
          </p>

          <div className="flex flex-col sm:flex-row items-stretch gap-3">
            <button
              type="button"
              onClick={() => handleSetWinner(1)}
              disabled={loading}
              className={`flex-1 min-h-[100px] p-5 rounded-2xl border-2 transition-colors flex flex-col items-center justify-center gap-2 active:scale-[0.98] ${
                match.data.winner === 1
                  ? "bg-pickle-primary/15 border-pickle-primary"
                  : "bg-white/5 border-white/10 hover:border-white/25"
              }`}
            >
              <div className="space-y-1 text-center">
                {team1Names.map((name, i) => (
                  <div key={i} className="font-semibold text-white text-sm">
                    {name}
                  </div>
                ))}
              </div>
              <span
                className={`mt-1 text-xs font-medium px-2.5 py-1 rounded-full ${
                  match.data.winner === 1
                    ? "bg-pickle-primary text-black"
                    : "bg-white/10 text-slate-400"
                }`}
              >
                {match.data.winner === 1 ? "Gagnants" : "Équipe 1"}
              </span>
            </button>

            <div className="hidden sm:flex items-center justify-center px-1">
              <span className="text-sm font-medium text-slate-500">VS</span>
            </div>

            <button
              type="button"
              onClick={() => handleSetWinner(2)}
              disabled={loading}
              className={`flex-1 min-h-[100px] p-5 rounded-2xl border-2 transition-colors flex flex-col items-center justify-center gap-2 active:scale-[0.98] ${
                match.data.winner === 2
                  ? "bg-pickle-primary/15 border-pickle-primary"
                  : "bg-white/5 border-white/10 hover:border-white/25"
              }`}
            >
              <div className="space-y-1 text-center">
                {team2Names.map((name, i) => (
                  <div key={i} className="font-semibold text-white text-sm">
                    {name}
                  </div>
                ))}
              </div>
              <span
                className={`mt-1 text-xs font-medium px-2.5 py-1 rounded-full ${
                  match.data.winner === 2
                    ? "bg-pickle-primary text-black"
                    : "bg-white/10 text-slate-400"
                }`}
              >
                {match.data.winner === 2 ? "Gagnants" : "Équipe 2"}
              </span>
            </button>
          </div>

          <div className="flex flex-col gap-2 pt-1">
            <button
              type="button"
              onClick={() => handleSetWinner(0)}
              disabled={loading}
              className={`w-full min-h-[44px] py-3 rounded-xl border text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                match.data.winner === 0
                  ? "bg-white/10 border-white/25 text-white"
                  : "border-white/10 text-slate-400 hover:text-white hover:border-white/20"
              }`}
            >
              <Minus className="w-4 h-4" />
              Match nul
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 text-sm text-slate-500 hover:text-slate-300 transition-colors"
            >
              Annuler
            </button>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
