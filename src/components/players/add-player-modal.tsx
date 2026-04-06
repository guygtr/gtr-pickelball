"use client";

import { useState } from "react";
import { X, UserPlus, Mail, Phone, BarChart3 } from "lucide-react";
import { GlassCard } from "@/components/ui/gtr/glass-card";
import { NeonButton } from "@/components/ui/gtr/neon-button";
import { createPlayer } from "@/actions/players";
import { useRouter } from "next/navigation";

export function AddPlayerModal({ 
  isOpen, 
  onClose, 
  leagueId 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  leagueId: string;
}) {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    skillLevel: 3.0,
  });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await createPlayer({
        ...formData,
        leagueId,
      });
      router.refresh();
      onClose();
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        skillLevel: 3.0,
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <GlassCard className="w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-pickle-green" />
            Nouveau Joueur
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Prénom</label>
              <input
                type="text"
                required
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full bg-slate-900 border border-white/10 rounded-lg py-2 px-4 text-white focus:ring-2 focus:ring-pickle-green/50 outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Nom</label>
              <input
                type="text"
                required
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full bg-slate-900 border border-white/10 rounded-lg py-2 px-4 text-white focus:ring-2 focus:ring-pickle-green/50 outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-slate-900 border border-white/10 rounded-lg py-2 pl-10 pr-4 text-white focus:ring-2 focus:ring-pickle-green/50 outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Téléphone</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full bg-slate-900 border border-white/10 rounded-lg py-2 pl-10 pr-4 text-white focus:ring-2 focus:ring-pickle-green/50 outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300 flex justify-between">
              Niveau (Skill Level)
              <span className="text-pickle-green font-bold">{formData.skillLevel.toFixed(1)}</span>
            </label>
            <div className="relative flex items-center gap-4">
              <BarChart3 className="w-4 h-4 text-slate-500" />
              <input
                type="range"
                min="1"
                max="6"
                step="0.5"
                value={formData.skillLevel}
                onChange={(e) => setFormData({ ...formData, skillLevel: parseFloat(e.target.value) })}
                className="flex-1 accent-pickle-green"
              />
            </div>
          </div>

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
              variant="green"
              onClick={() => {}} // Form handles submit
            >
              {loading ? "Création..." : "Ajouter"}
            </NeonButton>
          </div>
        </form>
      </GlassCard>
    </div>
  );
}
