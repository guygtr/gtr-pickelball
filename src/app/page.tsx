import Link from "next/link";
import { NeonButton } from "@/components/ui/gtr/neon-button";
import { GlassCard } from "@/components/ui/gtr/glass-card";
import { Zap, Smartphone, BarChart3, ChevronRight, Play } from "lucide-react";

/**
 * Page d'accueil GTR-Pickelball. architecture 3-tiers respectée. 🛡️ Ezio validation : WOW effect.
 */
export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-16 md:py-32 overflow-hidden">
      {/* Hero Section */}
      <div className="text-center space-y-12 max-w-4xl relative animate-fade-in-up">
        {/* Glow background decoration */}
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-pickle-blue/10 blur-[120px] rounded-full -z-10" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 blur-[100px] rounded-full -z-10" />
        
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-white/10 text-xs font-bold tracking-[0.2em] text-accent uppercase mb-4">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
            </span>
            GTR Vision 2026 Ready
          </div>
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.9]">
            LE PICKLEBALL, <br />
            <span className="text-gradient">REDÉFINI.</span>
          </h1>
          <p className="text-lg md:text-xl text-foreground/60 max-w-2xl mx-auto font-medium leading-relaxed">
            La plateforme ultime pour orchestrer vos ligues et tournois avec une élégance inédite. 
            Intelligence Monte-Carlo, organisation mobile-first et design futuriste.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6 pt-4">
          <Link href="/leagues/create">
            <NeonButton variant="green" className="px-10 py-6 text-sm tracking-[0.2em]">
              DÉMARRER MA LIGUE
              <ChevronRight className="w-5 h-5 ml-2" />
            </NeonButton>
          </Link>
          <Link href="/leagues">
            <NeonButton variant="blue" className="px-10 py-6 text-sm tracking-[0.2em]">
              EXPLORER LES LIGUES
              <Play className="w-4 h-4 ml-2" />
            </NeonButton>
          </Link>
        </div>
      </div>

      {/* Feature Preview */}
      <div className="mt-40 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl w-full px-4 animate-fade-in-up [animation-delay:200ms]">
        <FeatureCard 
          title="Gestion Intelligente" 
          description="Algorithmes Fair Play pour équilibrer les niveaux et rotations."
          icon={<Zap className="w-6 h-6 text-accent" />}
        />
        <FeatureCard 
          title="Expérience Mobile" 
          description="Utilisez l'app directement sur le terrain, fluide et instantanée."
          icon={<Smartphone className="w-6 h-6 text-pickle-blue" />}
        />
        <FeatureCard 
          title="Stats en Temps Réel" 
          description="Suivez vos performances et grimpez dans le classement global."
          icon={<BarChart3 className="w-6 h-6 text-pickle-pink" />}
        />
      </div>

      {/* Stats Summary - WOW Factor */}
      <div className="mt-32 max-w-6xl w-full px-4 animate-fade-in-up [animation-delay:400ms]">
        <GlassCard className="p-12 md:p-20 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-96 h-96 bg-pickle-blue/5 blur-[100px] rounded-full -z-10 group-hover:bg-pickle-blue/10 transition-all duration-700" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 text-center">
            <StatItem value="1,240" label="MATCHS GÉNÉRÉS" />
            <StatItem value="48" label="LIGUES ACTIVES" />
            <StatItem value="3,150" label="JOUEURS INSCRITS" />
            <StatItem value="99.9%" label="UPTIME GTR" />
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

function FeatureCard({ title, description, icon }: { title: string, description: string, icon: React.ReactNode }) {
  return (
    <GlassCard className="p-10 space-y-6 hover:border-white/20 transition-all duration-500 group">
      <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center text-2xl group-hover:bg-white/10 transition-colors">
        {icon}
      </div>
      <div className="space-y-2">
        <h3 className="text-xl font-bold tracking-tight">{title}</h3>
        <p className="text-foreground/40 leading-relaxed text-sm">
          {description}
        </p>
      </div>
    </GlassCard>
  );
}

function StatItem({ value, label }: { value: string, label: string }) {
  return (
    <div className="space-y-1">
      <div className="text-4xl md:text-5xl font-black text-white tracking-tighter">{value}</div>
      <div className="text-[10px] font-bold text-accent tracking-[0.3em] uppercase opacity-60">{label}</div>
    </div>
  );
}
