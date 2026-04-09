"use client";

import { useState } from "react";
import { Lock, KeyRound, CheckCircle2, AlertCircle } from "lucide-react";
import { NeonButton } from "@/components/ui/gtr/neon-button";
import { changePassword } from "@/actions/auth";
import toast from "react-hot-toast";

export function ChangePasswordForm() {
  const [isPending, setIsPending] = useState(false);
  const [formData, setFormData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error("Les nouveaux mots de passe ne correspondent pas.");
      return;
    }

    if (formData.newPassword.length < 6) {
      toast.error("Le mot de passe doit faire au moins 6 caractères.");
      return;
    }

    setIsPending(true);
    const loadingToast = toast.loading("Mise à jour du mot de passe...");

    try {
      const data = new FormData();
      data.append("oldPassword", formData.oldPassword);
      data.append("newPassword", formData.newPassword);
      data.append("confirmPassword", formData.confirmPassword);

      const result = await changePassword(null, data);

      if (result.success) {
        toast.success("Mot de passe mis à jour avec succès !", { id: loadingToast });
        setFormData({ oldPassword: "", newPassword: "", confirmPassword: "" });
      } else {
        toast.error(result.error || "Erreur lors de la mise à jour", { id: loadingToast });
      }
    } catch (error) {
      console.error(error);
      toast.error("Une erreur technique est survenue.", { id: loadingToast });
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="space-y-4">
        {/* Ancien Mot de Passe */}
        <div className="space-y-2">
          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">
            Ancien Mot de Passe
          </label>
          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-red-400 transition-colors" />
            <input
              type="password"
              required
              value={formData.oldPassword}
              onChange={(e) => setFormData({ ...formData, oldPassword: e.target.value })}
              placeholder="••••••••"
              className="w-full bg-slate-900/60 border border-white/5 rounded-2xl py-3.5 pl-12 pr-4 text-white focus:ring-2 focus:ring-red-500/20 focus:border-red-500/30 outline-none transition-all placeholder:text-slate-700"
            />
          </div>
        </div>

        <div className="h-px bg-white/5 w-1/2 mx-auto" />

        {/* Nouveau Mot de Passe */}
        <div className="space-y-2">
          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">
            Nouveau Mot de Passe
          </label>
          <div className="relative group">
            <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-pickle-secondary transition-colors" />
            <input
              type="password"
              required
              value={formData.newPassword}
              onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
              placeholder="••••••••"
              className="w-full bg-slate-900/60 border border-white/5 rounded-2xl py-3.5 pl-12 pr-4 text-white focus:ring-2 focus:ring-pickle-secondary/20 focus:border-pickle-secondary/30 outline-none transition-all placeholder:text-slate-700"
            />
          </div>
        </div>

        {/* Confirmation */}
        <div className="space-y-2">
          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">
            Confirmer le Nouveau Mot de Passe
          </label>
          <div className="relative group">
            <CheckCircle2 className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${
              formData.newPassword && formData.newPassword === formData.confirmPassword 
                ? 'text-pickle-primary' 
                : 'text-slate-500'
            }`} />
            <input
              type="password"
              required
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              placeholder="••••••••"
              className={`w-full bg-slate-900/60 border rounded-2xl py-3.5 pl-12 pr-4 text-white focus:ring-2 outline-none transition-all placeholder:text-slate-700 ${
                formData.confirmPassword && formData.newPassword !== formData.confirmPassword
                  ? 'border-red-500/50 focus:ring-red-500/20'
                  : 'border-white/5 focus:ring-pickle-primary/20 focus:border-pickle-primary/30'
              }`}
            />
          </div>
          {formData.confirmPassword && formData.newPassword !== formData.confirmPassword && (
            <p className="text-[10px] text-red-400 font-bold tracking-tight mt-1 ml-1 flex items-center gap-1">
              <AlertCircle size={12} /> Les mots de passe ne correspondent pas
            </p>
          )}
        </div>
      </div>

      <NeonButton 
        type="submit"
        variant="secondary"
        className="w-full py-4 text-[11px] tracking-[0.2em]"
        disabled={isPending || !formData.oldPassword || !formData.newPassword || formData.newPassword !== formData.confirmPassword}
      >
        {isPending ? "TRAITEMENT..." : "MODIFIER LE MOT DE PASSE"}
      </NeonButton>
    </form>
  );
}
