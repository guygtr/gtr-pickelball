"use client";

import { useState } from "react";
import { UserPlus, Trash2, Mail, Shield, User, Search, Loader2, Database, AlertCircle, ShieldCheck } from "lucide-react";
import { GlassCard } from "@/components/ui/gtr/glass-card";
import { NeonButton } from "@/components/ui/gtr/neon-button";
import { createManagerAccount, deleteManager } from "@/actions/admin";

interface Manager {
  id: string;
  email: string;
  name: string | null;
  role: string;
  lastSignIn?: string | null;
}

export function UserManagementClient({ initialManagers }: { initialManagers: Manager[] }) {
  const [managers, setManagers] = useState(initialManagers);
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const [formData, setFormData] = useState({
    email: "",
    name: "",
    password: "",
  });

  const generatePassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
    let pass = "";
    for (let i = 0; i < 12; i++) {
        pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(prev => ({ ...prev, password: pass }));
  };

  const filteredManagers = managers.filter(m => 
    m.email.toLowerCase().includes(search.toLowerCase()) || 
    (m.name?.toLowerCase().includes(search.toLowerCase()))
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.email || !formData.password) return;

    setLoading(true);
    try {
      const res = await createManagerAccount(formData.email, formData.password, formData.name);
      if (res.success && res.user) {
        setManagers(prev => [
          {
            id: res.user.id,
            email: formData.email,
            name: formData.name,
            role: "manager",
          },
          ...prev
        ]);
        setFormData({ email: "", name: "", password: "" });
        setIsAdding(false);
      } else {
        alert(res.error || "Erreur lors de la création du compte.");
      }
    } catch (error) {
      alert("Une erreur technique est survenue.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string, email: string) {
    if (!confirm(`Supprimer l'accès pour ${email} ?`)) return;
    try {
      const res = await deleteManager(id, email);
      if (res.success) {
        setManagers(prev => prev.filter(m => m.email !== email));
      } else {
        alert(res.error || "Erreur de suppression.");
      }
    } catch (error) {
      alert("Erreur lors de la suppression.");
      console.error(error);
    }
  }

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Add Manager Section (Standard Premium Bar-Manager) */}
      <section className="glass p-8 rounded-[2rem] border border-white/10 relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-pickle-blue via-pickle-green to-transparent opacity-50" />
        
        <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-pickle-blue/10 flex items-center justify-center text-pickle-blue">
                    <UserPlus size={24} />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-white tracking-tight">Ajouter un nouveau Gestionnaire</h2>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Activation de compte immédiate</p>
                </div>
            </div>
            
            <div className="text-xs font-bold px-4 py-1.5 bg-white/5 border border-white/5 rounded-full text-slate-400">
                {managers.length} Utilisateur(s)
            </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Email de connexion</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input 
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="adresse@gtr-pickleball.com"
                  required
                  className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 py-4 text-white focus:outline-none focus:ring-2 focus:ring-pickle-blue/50 transition-all placeholder:text-slate-700"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Mot de passe temporaire</label>
              <div className="relative">
                <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input 
                  type="text"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="••••••••••••"
                  required
                  className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-12 py-4 text-white focus:outline-none focus:ring-2 focus:ring-pickle-blue/50 transition-all placeholder:text-slate-700 font-mono text-sm"
                />
                <button 
                  type="button"
                  onClick={generatePassword}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-pickle-blue/60 hover:text-pickle-blue transition-all"
                  title="Générer un mot de passe"
                >
                  <Database size={18} />
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nom (Optionnel)</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input 
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Nom du gestionnaire"
                  className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 py-4 text-white focus:outline-none focus:ring-2 focus:ring-pickle-blue/50 transition-all placeholder:text-slate-700"
                />
              </div>
            </div>
          </div>
          
          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-pickle-blue to-pickle-green text-black font-extrabold px-8 py-4 rounded-xl hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-3 uppercase tracking-tighter shadow-xl shadow-pickle-blue/10"
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : <ShieldCheck size={20} />}
            Activer le compte Gestionnaire
          </button>
        </form>
        
        <div className="mt-6 flex items-start gap-3 text-pickle-green/60 p-4 bg-pickle-green/5 rounded-2xl border border-pickle-green/10">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <p className="text-[10px] uppercase tracking-wider font-bold leading-relaxed">
            IMPORTANT : Le gestionnaire peut se connecter immédiatement. Transmettez-lui le mot de passe manuellement.
            Toutes les actions de suppression sont définitives.
          </p>
        </div>
      </section>

      {/* Search Bar */}
      <div className="relative w-full max-w-md mx-auto">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          type="text"
          placeholder="Rechercher un gestionnaire..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-slate-600 focus:outline-none focus:border-pickle-blue transition-all"
        />
      </div>

      {/* Managers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredManagers.map((m) => (
          <GlassCard key={m.email} className="p-6 group hover:border-white/20 transition-all duration-500">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 border border-white/10 flex items-center justify-center text-white font-black text-xl">
                  {m.name?.[0] || m.email[0].toUpperCase()}
                </div>
                <div>
                  <h4 className="text-white font-bold">{m.name || "Gestionnaire"}</h4>
                  <p className="text-[10px] text-slate-500 font-bold">{m.email}</p>
                </div>
              </div>
              <button 
                onClick={() => handleDelete(m.id, m.email)}
                className="p-2.5 text-red-500/30 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            
            <div className="mt-6 flex flex-col gap-2 pt-6 border-t border-white/5">
                <div className="flex items-center justify-between">
                    <div className={`flex items-center gap-2 px-2.5 py-1 rounded-lg border text-[8px] font-black uppercase tracking-widest ${
                        m.role === 'admin' 
                        ? 'bg-pickle-orange/10 border-pickle-orange/30 text-pickle-orange' 
                        : 'bg-pickle-blue/10 border-pickle-blue/30 text-pickle-blue'
                    }`}>
                        <Shield className="w-2.5 h-2.5" />
                        {m.role}
                    </div>
                </div>
                <div className="text-[9px] text-slate-600 uppercase tracking-widest font-black flex items-center justify-between mt-1">
                    <span>Connexion</span>
                    <span className="text-slate-500">
                        {m.lastSignIn ? new Date(m.lastSignIn).toLocaleDateString() : 'Jamais'}
                    </span>
                </div>
            </div>
          </GlassCard>
        ))}

        {filteredManagers.length === 0 && (
          <div className="col-span-full py-16 text-center border-2 border-dashed border-white/5 rounded-3xl">
            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Aucun gestionnaire trouvé</p>
          </div>
        )}
      </div>
    </div>
  );
}
