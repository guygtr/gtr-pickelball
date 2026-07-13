import Link from "next/link";
import { NeonButton } from "@/components/ui/gtr/neon-button";
import { GlassCard } from "@/components/ui/gtr/glass-card";
import { Zap, Smartphone, BarChart3, ChevronRight } from "lucide-react";

/**
 * Page d'accueil — P1 UI : titres sobres, 1 CTA primary, motion calme.
 * Rollback : git revert du commit style(ui): P1
 */
export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-16 md:py-28">
      <div className="text-center space-y-10 max-w-3xl relative">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[420px] h-[420px] bg-pickle-secondary/8 blur-[100px] rounded-full -z-10" />

        <div className="space-y-5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass border border-white/10 text-xs font-medium text-slate-300">
            <span className="inline-flex rounded-full h-1.5 w-1.5 bg-accent" />
            Gestion de ligues · mobile-first
          </div>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight leading-tight text-white">
            Le pickleball,{" "}
            <span className="text-gradient">simplifié.</span>
          </h1>
          <p className="text-base md:text-lg text-slate-400 max-w-xl mx-auto leading-relaxed">
            Organisez ligues et sessions sur le terrain : matchmaking équilibré,
            co-gestion et outils mobiles — sans friction.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <Link href="/leagues/create">
            <NeonButton variant="primary" className="px-8 py-4 text-xs">
              Créer une ligue
              <ChevronRight className="w-4 h-4 ml-1.5" />
            </NeonButton>
          </Link>
          <Link
            href="/leagues"
            className="inline-flex items-center gap-2 px-6 py-3.5 text-sm font-medium text-slate-300 border border-white/10 rounded-xl hover:bg-white/5 hover:text-white transition-colors"
          >
            Voir mes ligues
          </Link>
        </div>
      </div>

      <div className="mt-28 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full px-4">
        <FeatureCard
          title="Matchmaking équilibré"
          description="Rotations et niveaux pensés pour le fair-play en session."
          icon={<Zap className="w-5 h-5 text-accent" />}
        />
        <FeatureCard
          title="Mobile sur le terrain"
          description="Saisie de scores et sessions, directement depuis le téléphone."
          icon={<Smartphone className="w-5 h-5 text-pickle-secondary" />}
        />
        <FeatureCard
          title="Classements clairs"
          description="Suivi des performances et hall of fame par ligue."
          icon={<BarChart3 className="w-5 h-5 text-pickle-tertiary" />}
        />
      </div>

      <div className="mt-16 max-w-2xl w-full px-4 text-center">
        <GlassCard className="p-7 md:p-8" hoverEffect={false}>
          <p className="text-slate-400 text-sm leading-relaxed">
            Co-gestion, import/export et recaps IA — pour les organisateurs qui
            veulent avancer vite sans sacrifier la clarté.
          </p>
        </GlassCard>
      </div>
    </div>
  );
}

function FeatureCard({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <GlassCard className="p-7 space-y-4 hover:border-white/15 transition-colors duration-300 group">
      <div className="w-11 h-11 bg-white/5 rounded-xl flex items-center justify-center border border-white/10 group-hover:border-white/15 transition-colors">
        {icon}
      </div>
      <div className="space-y-1.5">
        <h3 className="text-base font-semibold tracking-tight text-white">
          {title}
        </h3>
        <p className="text-slate-500 leading-relaxed text-sm">{description}</p>
      </div>
    </GlassCard>
  );
}
