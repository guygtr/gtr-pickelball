"use client";

import { useActionState } from "react";
import { signIn } from "@/actions/auth";
import { GlassCard } from "@/components/ui/gtr/glass-card";
import { NeonButton } from "@/components/ui/gtr/neon-button";
import { ShieldCheck, Mail, Lock, AlertCircle } from "lucide-react";

/**
 * Connexion — P1 UI : titres sobres, copy FR claire, 1 CTA primary.
 */
export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(
    signIn,
    {} as { error?: string }
  );

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-950">
      <div className="w-full max-w-md space-y-8 relative">
        <div className="absolute -top-20 -left-20 w-56 h-56 bg-pickle-primary/10 rounded-full blur-[90px]" />
        <div className="absolute -bottom-20 -right-20 w-56 h-56 bg-pickle-secondary/10 rounded-full blur-[90px]" />

        <div className="text-center space-y-3 relative">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/5 border border-white/10 mb-2">
            <ShieldCheck className="w-8 h-8 text-pickle-primary" />
          </div>
          <h1 className="text-2xl md:text-3xl font-semibold text-white tracking-tight">
            Connexion
          </h1>
          <p className="text-slate-400 text-sm">
            Accès réservé aux gestionnaires de ligue
          </p>
        </div>

        <GlassCard className="p-8 relative overflow-hidden border-white/10" hoverEffect={false}>
          <form action={formAction} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-400 ml-1">
                  Courriel
                </label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-pickle-primary transition-colors" />
                  <input
                    name="email"
                    type="email"
                    required
                    placeholder="nom@exemple.com"
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-11 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-pickle-primary/40 focus:bg-white/[0.07] transition-all text-sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-400 ml-1">
                  Mot de passe
                </label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-pickle-primary transition-colors" />
                  <input
                    name="password"
                    type="password"
                    required
                    placeholder="••••••••"
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-11 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-pickle-primary/40 focus:bg-white/[0.07] transition-all text-sm"
                  />
                </div>
              </div>
            </div>

            {state?.error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3.5 flex items-center gap-3 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <p>{state.error}</p>
              </div>
            )}

            <NeonButton
              type="submit"
              className="w-full py-4"
              variant="primary"
              disabled={isPending}
            >
              {isPending ? "Connexion…" : "Se connecter"}
            </NeonButton>
          </form>

          <div className="mt-6 pt-5 border-t border-white/5 text-center">
            <p className="text-xs text-slate-500">
              Inscription publique désactivée — contactez un admin.
            </p>
          </div>
        </GlassCard>

        <p className="text-center text-slate-600 text-xs">
          GTR-Pickelball · accès sécurisé
        </p>
      </div>
    </div>
  );
}
