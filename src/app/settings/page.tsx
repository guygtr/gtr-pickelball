import React from "react";
import { redirect } from "next/navigation";
import { getEnsuredUser } from "@/lib/auth-utils";
import { ExportDataButton } from "@/components/settings/export-data-button";
import { ImportDataButton } from "@/components/settings/import-data-button";
import { User, Shield, Database } from "lucide-react";

export default async function SettingsPage() {
  let user;
  try {
    user = await getEnsuredUser();
  } catch {
    redirect("/auth/login");
  }

  return (
    <div className="container mx-auto px-4 pt-24 pb-12 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Mon Compte</h1>
        <p className="text-slate-400">Gérez vos informations personnelles et vos données.</p>
      </div>

      <div className="space-y-6">
        {/* Profile Section */}
        <section className="glass p-6 rounded-3xl border border-white/10">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 rounded-2xl bg-accent/20 text-accent ring-1 ring-accent/30">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Profil</h2>
              <p className="text-sm text-slate-400">Vos informations de connexion</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">
                Adresse Email
              </label>
              <div className="glass px-4 py-3 rounded-xl border border-white/5 text-white bg-white/5">
                {user.email}
              </div>
            </div>
          </div>
        </section>

        {/* Data & Privacy Section */}
        <section className="glass p-6 rounded-3xl border border-white/10">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 rounded-2xl bg-indigo-500/20 text-indigo-400 ring-1 ring-indigo-500/30">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Données & Confidentialité</h2>
              <p className="text-sm text-slate-400">Exportez ou gérez vos informations</p>
            </div>
          </div>

          <div className="space-y-4">
            <ExportDataButton />
            <ImportDataButton />
          </div>
        </section>

        {/* Security Section (Placeholders for now) */}
        <section className="glass p-6 rounded-3xl border border-white/10 opacity-60">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 rounded-2xl bg-red-500/20 text-red-400 ring-1 red-500/30">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Sécurité</h2>
              <p className="text-sm text-slate-400">Mot de passe et authentification (Bientôt)</p>
            </div>
          </div>
        </section>
      </div>

      {/* Footer info */}
      <p className="mt-12 text-center text-xs text-slate-500 font-medium">
        GTR-Pickelball v1.0.0 — Fait avec passion pour le sport.
      </p>
    </div>
  );
}
