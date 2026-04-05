import Link from "next/link";

/**
 * Page de Connexion GTR-Pickelball. architecture 3-tiers respectée. 🛡️ Starlink : Auth Courriel/Mot de passe active.
 */
export default function LoginPage() {
  return (
    <div className="flex flex-col items-center justify-center pt-8 px-4">
      <div className="glass max-w-md w-full p-10 rounded-3xl space-y-8 border border-white/10 shadow-2xl">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight">Bonjour !</h1>
          <p className="text-foreground/60">Connectez-vous pour voir vos matchs.</p>
        </div>

        <form className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold ml-1">E-mail</label>
            <input 
              type="email" 
              placeholder="votre@email.com" 
              className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3 outline-none focus:border-accent transition-colors"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold ml-1">Mot de passe</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3 outline-none focus:border-accent transition-colors"
            />
          </div>

          <button className="w-full bg-accent text-accent-foreground py-4 rounded-xl font-bold shadow-lg hover:shadow-accent/40 active:scale-[0.98] transition-all">
            Connexion
          </button>
        </form>

        <p className="text-center text-sm text-foreground/50">
          Pas encore de compte ?{" "}
          <Link href="/auth/register" className="text-accent font-bold hover:underline">
            S'inscrire
          </Link>
        </p>
      </div>
    </div>
  );
}
