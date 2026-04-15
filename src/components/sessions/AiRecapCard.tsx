"use client";

import { useState } from "react";
import { Sparkles, RefreshCw, Trophy, Quote, ScrollText } from "lucide-react";
import { GlassCard } from "@/components/ui/gtr/glass-card";
import { NeonButton } from "@/components/ui/gtr/neon-button";
import { generateSmartRecap } from "@/actions/ai-recap";
import toast from "react-hot-toast";

interface AiRecapCardProps {
  sessionId: string;
  initialRecap?: string;
  isCompleted: boolean;
}

export function AiRecapCard({ sessionId, initialRecap, isCompleted }: AiRecapCardProps) {
  const [recap, setRecap] = useState<string | undefined>(initialRecap);
  const [loading, setLoading] = useState(false);

  async function handleGenerate() {
    setLoading(true);
    const loadingToast = toast.loading("L'IA GTR analyse la session...");
    try {
      const result = await generateSmartRecap(sessionId);
      if (result.success) {
        setRecap(result.recap);
        toast.success("Recap généré avec succès !", { id: loadingToast });
      } else {
        toast.error(result.error || "Erreur lors de la génération", { id: loadingToast });
      }
    } catch (error) {
      console.error(error);
      toast.error("Échec de la connexion avec l'IA", { id: loadingToast });
    } finally {
      setLoading(false);
    }
  }

  if (!isCompleted && !recap) return null;

  return (
    <GlassCard className="relative overflow-hidden border-pickle-secondary/30 bg-gradient-to-br from-black/40 via-pickle-secondary/5 to-black/40 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
        <Sparkles className="w-40 h-40 text-pickle-secondary" />
      </div>

      <div className="p-6 relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-pickle-secondary/20 rounded-lg">
              <ScrollText className="w-5 h-5 text-pickle-secondary" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white tracking-widest uppercase">
                GTR Smart Recap
              </h3>
              <p className="text-[9px] text-pickle-secondary/60 font-black tracking-[0.3em] uppercase">
                Analyse Narrative par Grok IA
              </p>
            </div>
          </div>

          {(recap && isCompleted) && (
            <button 
              onClick={handleGenerate}
              disabled={loading}
              className="p-2 text-slate-500 hover:text-white transition-colors"
                title="Régénérer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          )}
        </div>

        {recap ? (
          <div className="space-y-4">
            <div className="relative">
              <Quote className="absolute -left-2 -top-2 w-8 h-8 text-white/5" />
              <div className="prose prose-invert max-w-none">
                <div className="text-slate-300 leading-relaxed text-sm whitespace-pre-line font-medium italic">
                  {recap}
                </div>
              </div>
            </div>
            
            <div className="pt-4 flex items-center gap-6 border-t border-white/5">
                <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-pickle-primary" />
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Highlights validés</span>
                </div>
                <div className="flex -space-x-2 ml-auto">
                    {[1,2,3].map(i => (
                        <div key={i} className="w-6 h-6 rounded-full border-2 border-slate-900 bg-pickle-secondary/20 flex items-center justify-center">
                            <Sparkles className="w-3 h-3 text-pickle-secondary" />
                        </div>
                    ))}
                </div>
            </div>
          </div>
        ) : (
          <div className="py-12 flex flex-col items-center text-center space-y-6">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center animate-pulse">
              <Sparkles className="w-8 h-8 text-slate-700" />
            </div>
            <div className="space-y-2">
              <h4 className="text-slate-300 font-bold">Récit de session disponible</h4>
              <p className="text-slate-500 text-xs max-w-xs mx-auto">
                La session est terminée. Laissez l&apos;IA analyser les performances et rédiger le compte-rendu de vos exploits.
              </p>
            </div>
            <NeonButton 
              onClick={handleGenerate} 
              disabled={loading}
              variant="secondary"
              className="px-8"
            >
              {loading ? "ANALYSE EN COURS..." : "GÉNÉRER LE RECAP"}
            </NeonButton>
          </div>
        )}
      </div>
    </GlassCard>
  );
}
