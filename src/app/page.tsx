import Link from "next/link";

/**
 * Page d'accueil GTR-Pickelball. architecture 3-tiers respectée. 🛡️ Ezio validation : WOW effect.
 */
export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-16 md:py-32">
      {/* Hero Section */}
      <div className="text-center space-y-8 max-w-4xl relative">
        {/* Glow background decoration */}
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-64 h-64 bg-accent/20 blur-[100px] rounded-full -z-10" />
        
        <div className="space-y-4">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight">
            Le Pickleball, <br />
            <span className="text-gradient">Redéfini.</span>
          </h1>
          <p className="text-lg md:text-xl text-foreground/70 max-w-2xl mx-auto">
            La plateforme ultime pour gérer vos ligues, terrains et matchs. 
            Moderne, intelligente et prête pour 2026.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link href="/auth/register">
            <button className="bg-accent text-accent-foreground px-8 py-4 rounded-2xl text-lg font-bold shadow-xl hover:shadow-accent/40 transition-all hover:scale-105 active:scale-95">
              Démarrer ma ligue
            </button>
          </Link>
          <Link href="/leagues">
            <button className="glass glass-hover px-8 py-4 rounded-2xl text-lg font-bold transition-all">
              Explorer les ligues
            </button>
          </Link>
        </div>
      </div>

      {/* Feature Preview */}
      <div className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl w-full">
        <FeatureCard 
          title="Gestion Intelligente" 
          description="Algorithmes Fair Play pour équilibrer les niveaux et rotations."
          icon="⚡"
        />
        <FeatureCard 
          title="Mobile-First PWA" 
          description="Utilisez l'app directement sur le terrain, même hors ligne."
          icon="📱"
        />
        <FeatureCard 
          title="Stats en Temps Réel" 
          description="Suivez vos performances et grimpez dans le classement."
          icon="📊"
        />
      </div>
    </div>
  );
}

function FeatureCard({ title, description, icon }: { title: string, description: string, icon: string }) {
  return (
    <div className="glass p-8 rounded-3xl space-y-4 border border-white/5 hover:border-white/20 transition-colors">
      <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-2xl">
        {icon}
      </div>
      <h3 className="text-xl font-bold">{title}</h3>
      <p className="text-foreground/60 leading-relaxed">
        {description}
      </p>
    </div>
  );
}
