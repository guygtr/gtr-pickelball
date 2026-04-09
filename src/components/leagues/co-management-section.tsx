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

export function CoManagementSection({ leagueId, coManagers, isOwner }: CoManagementSectionProps) {
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    if (!isOwner) {
        return (
            <GlassCard className="p-8 border-pickle-secondary/20 bg-pickle-secondary/5">
                <div className="flex items-center gap-4 text-pickle-secondary mb-4">
                    <ShieldCheck className="w-6 h-6" />
                    <h3 className="text-xl font-black uppercase tracking-tighter">Accès Co-Gestion</h3>
                </div>
                <p className="text-slate-400 font-medium text-sm leading-relaxed">
                    Vous êtes co-gestionnaire de cette ligue. Seul le propriétaire principal peut ajouter ou retirer des membres de l&apos;équipe de gestion.
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
            toast.success("Co-gestionnaire ajouté avec succès !");
            setEmail("");
        } else {
            toast.error(res.error || "Une erreur est survenue.");
        }
    };

    const handleRemove = async (managerId: string) => {
        if (!confirm("Voulez-vous vraiment retirer ce co-gestionnaire ?")) return;

        const res = await removeCoManager(leagueId, managerId);
        if (res.success) {
            toast.success("Gestionnaire retiré.");
        } else {
            toast.error(res.error || "Erreur lors du retrait.");
        }
    };

    return (
        <section className="space-y-8">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-pickle-secondary/10 rounded-xl flex items-center justify-center border border-pickle-secondary/20">
                    <Users className="w-6 h-6 text-pickle-secondary" />
                </div>
                <div>
                    <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Équipe de Co-Gestion</h2>
                    <p className="text-slate-500 text-sm font-medium">Partagez les commandes de votre ligue avec d&apos;autres gestionnaires.</p>
                </div>
            </div>

            <GlassCard className="p-8">
                <form onSubmit={handleAdd} className="flex flex-col md:flex-row gap-4 mb-10">
                    <div className="relative flex-grow">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                        <input
                            type="email"
                            placeholder="Email du gestionnaire à inviter..."
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-pickle-secondary/50 transition-colors font-medium"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <NeonButton 
                        variant="secondary" 
                        type="submit" 
                        disabled={isLoading}
                        className="px-8 whitespace-nowrap tracking-widest"
                    >
                        {isLoading ? "CHARGEMENT..." : "INVITER"}
                        <PlusCircle className="w-5 h-5 ml-2" />
                    </NeonButton>
                </form>

                <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-slate-500 tracking-[0.3em] uppercase mb-4">Gestionnaires Actuels</h4>
                    {coManagers.length === 0 ? (
                        <p className="text-slate-500 text-sm italic py-4">Aucun co-gestionnaire pour le moment. Vous gérez cette ligue en solo.</p>
                    ) : (
                        <div className="grid gap-4">
                            {coManagers.map((item) => (
                                <div key={item.manager.id} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5 group hover:border-white/10 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center font-bold text-pickle-secondary">
                                            {item.manager.name?.[0] || item.manager.email[0].toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="text-white font-bold tracking-tight">{item.manager.name || "Gestionnaire GTR"}</p>
                                            <p className="text-slate-500 text-xs font-medium">{item.manager.email}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleRemove(item.manager.id)}
                                        className="p-2 text-slate-500 hover:text-pickle-tertiary hover:bg-pickle-tertiary/10 rounded-lg transition-all"
                                        title="Retirer"
                                    >
                                        <UserMinus className="w-5 h-5" />
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
