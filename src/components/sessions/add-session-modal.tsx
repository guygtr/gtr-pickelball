"use client";

import { useState } from "react";
import { X, Calendar as CalendarIcon, MapPin, Clock } from "lucide-react";
import { GlassCard } from "@/components/ui/gtr/glass-card";
import { NeonButton } from "@/components/ui/gtr/neon-button";
import { createSession } from "@/actions/sessions";
import { useRouter } from "next/navigation";

export function AddSessionModal({ 
  isOpen, 
  onClose, 
  leagueId,
  leagueSettings
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  leagueId: string;
  leagueSettings?: Record<string, any>;
}) {
  // Helper to get initials states rounded to 15m
  const getInitialValues = () => {
    const now = new Date();
    
    // Date part (YYYY-MM-DD)
    const tzOffset = now.getTimezoneOffset() * 60000;
    const datePart = new Date(now.getTime() - tzOffset).toISOString().slice(0, 10);
    
    // Default values from settings OR now
    const defaultTime = (leagueSettings?.defaultStartTime as string) || null;
    let hourPart = now.getHours().toString().padStart(2, '0');
    let minutePart = "00";

    if (defaultTime && defaultTime.includes(':')) {
      [hourPart, minutePart] = defaultTime.split(':');
    } else {
      const minutes = now.getMinutes();
      const roundedMinutes = (Math.ceil(minutes / 15) * 15) % 60;
      minutePart = roundedMinutes.toString().padStart(2, '0');
    }
    
    return { datePart, hourPart, minutePart };
  };

  const initial = getInitialValues();
  const [datePart, setDatePart] = useState(initial.datePart);
  const [hourPart, setHourPart] = useState(initial.hourPart);
  const [minutePart, setMinutePart] = useState(initial.minutePart);
  const [location, setLocation] = useState((leagueSettings?.defaultLocation as string) || "");
  const [duration, setDuration] = useState((leagueSettings?.defaultDuration as string || "120").toString());
  const [maxPlayers] = useState((leagueSettings?.maxPlayers as number) || 20);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      // Recombine date and time
      const dateTimeStr = `${datePart}T${hourPart}:${minutePart}:00`;
      const finalDate = new Date(dateTimeStr);

      const result = await createSession({
        leagueId,
        date: finalDate.toISOString(),
        location,
        duration: parseInt(duration),
        maxPlayers,
        iterations: 10000,
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

  const durationOptions = [];
  for (let mins = 30; mins <= 240; mins += 15) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    const label = `${h}h${m.toString().padStart(2, '0')}`;
    durationOptions.push({ value: mins.toString(), label });
  }

  const hourOptions = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
  const minuteOptions = ["00", "15", "30", "45"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <GlassCard className="w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-pickle-secondary" />
            Planifier une Session
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Date</label>
                <div className="relative">
                  <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                  <input
                    type="date"
                    required
                    value={datePart}
                    onChange={(e) => setDatePart(e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 rounded-lg py-2 pl-9 pr-2 text-white focus:ring-2 focus:ring-pickle-secondary/50 outline-none transition-all text-sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Heure de début</label>
                <div className="flex gap-2">
                  <select
                    value={hourPart}
                    onChange={(e) => setHourPart(e.target.value)}
                    className="flex-1 bg-slate-900 border border-white/10 rounded-lg py-2 px-2 text-white focus:ring-2 focus:ring-pickle-secondary/50 outline-none transition-all appearance-none cursor-pointer text-center text-sm"
                  >
                    {hourOptions.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                  <span className="text-white self-center">:</span>
                  <select
                    value={minutePart}
                    onChange={(e) => setMinutePart(e.target.value)}
                    className="flex-1 bg-slate-900 border border-white/10 rounded-lg py-2 px-2 text-white focus:ring-2 focus:ring-pickle-secondary/50 outline-none transition-all appearance-none cursor-pointer text-center text-sm"
                  >
                    {minuteOptions.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Durée</label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <select
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-lg py-2 pl-10 pr-4 text-white focus:ring-2 focus:ring-pickle-secondary/50 outline-none transition-all appearance-none cursor-pointer text-sm"
                >
                  {durationOptions.map((opt) => (
                    <option key={opt.value} value={opt.value} className="bg-slate-900">
                      {opt.label}
                    </option>
                  ))}
                </select>
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
                  className="w-full bg-slate-900 border border-white/10 rounded-lg py-2 pl-10 pr-4 text-white focus:ring-2 focus:ring-pickle-secondary/50 outline-none transition-all text-sm"
                />
              </div>
            </div>
          </div>
          
          {error && (
            <div className="my-2 p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-500 text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
              {error}
            </div>
          )}
          
          <div className="pt-6 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/20 rounded-lg text-white/70 hover:text-white font-bold transition-all text-sm uppercase tracking-widest"
            >
              Annuler
            </button>
            <NeonButton 
              className="flex-1" 
              variant="secondary"
              type="submit"
            >
              {loading ? "Création..." : "Planifier"}
            </NeonButton>
          </div>
        </form>
      </GlassCard>
    </div>
  );
}
