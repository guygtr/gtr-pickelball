"use client";

import { useActionState } from "react";
import { signIn } from "@/actions/auth";
import { GlassCard } from "@/components/ui/gtr/glass-card";
import { NeonButton } from "@/components/ui/gtr/neon-button";
import { ShieldCheck, Mail, Lock, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(signIn, {} as { error?: string });

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-950">
      <div className="w-full max-w-md space-y-8 relative">
        {/* Glow Effect */}
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-pickle-primary/20 rounded-full blur-[100px]" />
        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-pickle-secondary/20 rounded-full blur-[100px]" />

        <div className="text-center space-y-2 relative">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-pickle-primary to-pickle-secondary p-[1px] mb-4">
            <div className="w-full h-full bg-slate-950 rounded-[23px] flex items-center justify-center">
              <ShieldCheck className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter italic uppercase">
            GTR <span className="text-pickle-primary">Pickleball</span>
          </h1>
          <p className="text-slate-400 font-medium">Production Access Protocol</p>
        </div>

        <GlassCard className="p-8 relative overflow-hidden border-white/10">
          <form action={formAction} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">
                  Email du Capitaine
                </label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-pickle-primary transition-colors" />
                  <input
                    name="email"
                    type="email"
                    required
                    placeholder="nom@exemple.com"
                    className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-pickle-primary/50 focus:bg-white/10 transition-all font-medium"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">
                  Code d&apos;Accès
                </label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-pickle-primary transition-colors" />
                  <input
                    name="password"
                    type="password"
                    required
                    placeholder="••••••••"
                    className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-pickle-primary/50 focus:bg-white/10 transition-all font-medium"
                  />
                </div>
              </div>
            </div>

            {state?.error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3 text-red-400 text-sm font-bold animate-in fade-in slide-in-from-top-2">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <p>{state.error}</p>
              </div>
            )}

            <NeonButton
              type="submit"
              className="w-full py-6 text-lg"
              variant="primary"
              disabled={isPending}
            >
              {isPending ? "Authentification..." : "Entrer dans l'Arène"}
            </NeonButton>
          </form>

          <div className="mt-8 pt-6 border-t border-white/5 text-center">
             <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">
                GTR-Team Security Force v2.1
             </p>
          </div>
        </GlassCard>

        <p className="text-center text-slate-600 text-xs font-medium">
          Accès restreint aux membres de la ligue GTR. <br/>
          L&apos;inscription publique est désactivée.
        </p>
      </div>
    </div>
  );
}
