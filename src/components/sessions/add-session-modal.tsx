"use client";

import { useState } from "react";
import { X, Calendar as CalendarIcon, MapPin } from "lucide-react";
import { GlassCard } from "@/components/ui/gtr/glass-card";
import { NeonButton } from "@/components/ui/gtr/neon-button";
import { createSession } from "@/actions/sessions";
import { useRouter } from "next/navigation";

export function AddSessionModal({ 
  isOpen, 
  onClose, 
  leagueId 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  leagueId: string;
}) {
  const [date, setDate] = useState("");
  const [location, setLocation] = useState("");
  const [maxPlayers] = useState(20);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const result = await createSession({
        leagueId,
        date: new Date(date).toISOString(),
        location,
        maxPlayers,
      });

      if (result.success) {
        router.refresh();
        onClose();
      } else {
        setError(result.error || "Erreur lors de la création");
      }
    } catch (err) {
      console.error(err);
      setError("Une erreur inattendue est survenue");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <GlassCard className="w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-pickle-blue" />
            Planifier une Session
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Date et Heure</label>
            <div className="relative">
              <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="datetime-local"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-900 border border-white/10 rounded-lg py-2 pl-10 pr-4 text-white focus:ring-2 focus:ring-pickle-blue/50 outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Lieu (Optionnel)</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Ex: Centre Sportif GTR"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-slate-900 border border-white/10 rounded-lg py-2 pl-10 pr-4 text-white focus:ring-2 focus:ring-pickle-blue/50 outline-none transition-all"
              />
            </div>
          </div>
          
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-500 text-sm font-medium">
              {error}
            </div>
          )}
          
          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-slate-300 font-medium transition-all"
            >
              Annuler
            </button>
            <NeonButton 
              className="flex-1" 
              variant="blue"
              onClick={() => {}} // Form will handle it
            >
              {loading ? "Création..." : "Planifier"}
            </NeonButton>
          </div>
        </form>
      </GlassCard>
    </div>
  );
}
