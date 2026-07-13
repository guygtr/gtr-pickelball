"use client";

import { useState } from "react";
import { GlassCard } from "@/components/ui/gtr/glass-card";
import { NeonButton } from "@/components/ui/gtr/neon-button";
import { Users, Mail, UserMinus, PlusCircle, ShieldCheck } from "lucide-react";
import { addCoManager, removeCoManager } from "@/actions/co-management";
import toast from "react-hot-toast";

interface CoManagerInfo {
  manager: {
    id: string;
    email: string;
    name: string | null;
  };
}

interface CoManagementSectionProps {
  leagueId: string;
  coManagers: CoManagerInfo[];
  isOwner: boolean;
}

/**
 * Co-gestion — Option B : titres sobres.
 */
export function CoManagementSection({
  leagueId,
  coManagers,
  isOwner,
}: CoManagementSectionProps) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  if (!isOwner) {
    return (
      <GlassCard
        className="p-6 border-white/10"
        hoverEffect={false}
      >
        <div className="flex items-center gap-3 text-slate-300 mb-3">
          <ShieldCheck className="w-5 h-5 text-pickle-primary" />
          <h3 className="text-lg font-semibold">Accès co-gestion</h3>
        </div>
        <p className="text-slate-400 text-sm leading-relaxed">
          Vous êtes co-gestionnaire. Seul le propriétaire peut ajouter ou
          retirer des membres de l&apos;équipe.
        </p>
      </GlassCard>
    );
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    const res = await addCoManager(leagueId, email);
    setIsLoading(false);

    if (res.success) {
      toast.success("Co-gestionnaire ajouté");
      setEmail("");
    } else {
      toast.error(res.error || "Une erreur est survenue.");
    }
  };

  const handleRemove = async (managerId: string) => {
    if (!confirm("Retirer ce co-gestionnaire ?")) return;

    const res = await removeCoManager(leagueId, managerId);
    if (res.success) {
      toast.success("Gestionnaire retiré");
    } else {
      toast.error(res.error || "Erreur lors du retrait.");
    }
  };

  return (
    <section className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center border border-white/10">
          <Users className="w-5 h-5 text-pickle-secondary" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-white tracking-tight">
            Co-gestion
          </h2>
          <p className="text-slate-500 text-sm">
            Partagez la gestion de la ligue avec d&apos;autres comptes.
          </p>
        </div>
      </div>

      <GlassCard className="p-6" hoverEffect={false}>
        <form
          onSubmit={handleAdd}
          className="flex flex-col md:flex-row gap-3 mb-8"
        >
          <div className="relative flex-grow">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="email"
              placeholder="courriel@exemple.com"
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white text-sm focus:outline-none focus:border-pickle-primary/40 transition-colors"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <NeonButton
            variant="primary"
            type="submit"
            disabled={isLoading}
            className="px-6 whitespace-nowrap"
          >
            {isLoading ? "…" : "Inviter"}
            <PlusCircle className="w-4 h-4 ml-1.5" />
          </NeonButton>
        </form>

        <div className="space-y-3">
          <h4 className="text-xs font-medium text-slate-500 mb-2">
            Gestionnaires actuels
          </h4>
          {coManagers.length === 0 ? (
            <p className="text-slate-500 text-sm py-2">
              Aucun co-gestionnaire — vous gérez cette ligue seul·e.
            </p>
          ) : (
            <div className="grid gap-2">
              {coManagers.map((item) => (
                <div
                  key={item.manager.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 bg-white/5 rounded-full flex items-center justify-center text-sm font-medium text-pickle-secondary shrink-0">
                      {item.manager.name?.[0] ||
                        item.manager.email[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-white text-sm font-medium truncate">
                        {item.manager.name || "Gestionnaire"}
                      </p>
                      <p className="text-slate-500 text-xs truncate">
                        {item.manager.email}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemove(item.manager.id)}
                    className="p-2 text-slate-500 hover:text-red-400 transition-colors rounded-lg hover:bg-red-500/10"
                    title="Retirer"
                  >
                    <UserMinus className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </GlassCard>
    </section>
  );
}
