"use client";

import { useState } from "react";
import { Sparkles, RefreshCw, ScrollText } from "lucide-react";
import { GlassCard } from "@/components/ui/gtr/glass-card";
import { NeonButton } from "@/components/ui/gtr/neon-button";
import { generateSmartRecap } from "@/actions/ai-recap";
import toast from "react-hot-toast";

interface AiRecapCardProps {
  sessionId: string;
  initialRecap?: string;
  isCompleted: boolean;
}

/**
 * Recap IA — Option B : ton calme, copy FR.
 */
export function AiRecapCard({
  sessionId,
  initialRecap,
  isCompleted,
}: AiRecapCardProps) {
  const [recap, setRecap] = useState<string | undefined>(initialRecap);
  const [loading, setLoading] = useState(false);

  async function handleGenerate() {
    setLoading(true);
    const loadingToast = toast.loading("Analyse de la session…");
    try {
      const result = await generateSmartRecap(sessionId);
      if (result.success) {
        setRecap(result.recap ?? undefined);
        toast.success("Recap prêt", { id: loadingToast });
      } else {
        toast.error(result.error || "Erreur", { id: loadingToast });
      }
    } catch {
      toast.error("Échec de connexion IA", { id: loadingToast });
    } finally {
      setLoading(false);
    }
  }

  if (!isCompleted && !recap) return null;

  return (
    <GlassCard
      className="p-5 border-white/10 bg-white/[0.02]"
      hoverEffect={false}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/5 rounded-lg border border-white/10">
            <ScrollText className="w-4 h-4 text-pickle-secondary" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">Recap IA</h3>
            <p className="text-xs text-slate-500">Compte-rendu de session</p>
          </div>
        </div>

        {recap && isCompleted && (
          <button
            type="button"
            onClick={handleGenerate}
            disabled={loading}
            className="p-2 text-slate-500 hover:text-white transition-colors rounded-lg hover:bg-white/5"
            title="Régénérer"
          >
            <RefreshCw
              className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
            />
          </button>
        )}
      </div>

      {recap ? (
        <div className="text-slate-300 leading-relaxed text-sm whitespace-pre-line">
          {recap}
        </div>
      ) : (
        <div className="py-8 flex flex-col items-center text-center space-y-4">
          <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center border border-white/10">
            <Sparkles className="w-6 h-6 text-slate-600" />
          </div>
          <div className="space-y-1">
            <h4 className="text-slate-200 font-medium text-sm">
              Session terminée
            </h4>
            <p className="text-slate-500 text-xs max-w-xs">
              Générez un court récit des highlights de la soirée.
            </p>
          </div>
          <NeonButton
            onClick={handleGenerate}
            disabled={loading}
            variant="primary"
            className="px-6"
          >
            {loading ? "Analyse…" : "Générer le recap"}
          </NeonButton>
        </div>
      )}
    </GlassCard>
  );
}
