import { createLeague } from "@/actions/league";

export default function CreateLeaguePage() {
  return (
    <main className="min-h-screen pt-24 pb-12 px-4 bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950/20">
      <div className="max-w-2xl mx-auto">
        <div className="glass-card p-8 rounded-3xl border border-white/10 shadow-2xl">
          <h1 className="text-3xl font-bold text-white mb-2 bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
            Nouvelle Ligue
          </h1>
          <p className="text-slate-400 mb-8">
            Configurez les paramètres de votre ligue pour commencer à organiser vos matchs.
          </p>

          <form action={createLeague} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-2">
                Nom de la ligue
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                placeholder="Ex: Ligue du Lundi Soir"
                className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-slate-300 mb-2">
                Description (facultatif)
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                placeholder="Quelques mots sur la ligue..."
                className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all resize-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label htmlFor="maxPlayers" className="block text-sm font-medium text-slate-300 mb-2">
                  Nombre de joueurs
                </label>
                <input
                  type="number"
                  id="maxPlayers"
                  name="maxPlayers"
                  required
                  defaultValue={12}
                  min={2}
                  className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                />
              </div>
              <div>
                <label htmlFor="levelMin" className="block text-sm font-medium text-slate-300 mb-2">
                  Niveau Min
                </label>
                <select
                  id="levelMin"
                  name="levelMin"
                  className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all appearance-none"
                >
                  <option value="2.0">2.0 (Débutant)</option>
                  <option value="2.5">2.5</option>
                  <option value="3.0">3.0 (Intermédiaire)</option>
                  <option value="3.5">3.5</option>
                  <option value="4.0">4.0 (Avancé)</option>
                </select>
              </div>
              <div>
                <label htmlFor="levelMax" className="block text-sm font-medium text-slate-300 mb-2">
                  Niveau Max
                </label>
                <select
                  id="levelMax"
                  name="levelMax"
                  className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all appearance-none"
                >
                  <option value="3.5">3.5</option>
                  <option value="4.0">4.0</option>
                  <option value="4.5">4.5</option>
                  <option value="5.0">5.0 (Elite)</option>
                </select>
              </div>
            </div>

            <div className="pt-6">
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all active:scale-95"
              >
                Créer la ligue
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
