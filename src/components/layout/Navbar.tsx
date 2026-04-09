"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu, X, ShieldCheck, User, LogIn, UserPlus, LogOut } from "lucide-react";
import { NeonButton } from "@/components/ui/gtr/neon-button";
import { signOut } from "@/actions/auth";

interface NavbarProps {
  userEmail?: string;
  isAdmin?: boolean;
}

/**
 * Composant Navbar avec effet Glassmorphism et Menu Mobile.
 */
export const Navbar = ({ userEmail, isAdmin }: NavbarProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <>
      <nav className="fixed top-2 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-7xl">
        <div className="bg-slate-950 border border-white/10 px-4 md:px-6 py-3 md:py-4 rounded-2xl flex items-center justify-between shadow-2xl">
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center gap-2 md:gap-3 group">
            <div className="relative w-8 h-8 md:w-10 md:h-10 overflow-hidden rounded-lg border border-white/20 transform transition-transform group-hover:scale-105">
              <Image
                src="/logo.png"
                alt="GTR-Pickelball Logo"
                fill
                className="object-cover"
              />
            </div>
            <span className="font-bold text-lg md:text-xl tracking-tight text-gradient">
              GTR-Pickelball
            </span>
          </Link>

          {/* Navigation Links (Desktop) */}
          <div className="hidden md:flex items-center gap-8 font-medium">
            <Link href="/leagues" className="hover:text-accent transition-colors">Mes Ligues</Link>
            {isAdmin && (
              <Link href="/admin" className="text-pickle-muted hover:text-pickle-muted/80 transition-colors flex items-center gap-2">
                <ShieldCheck size={18} />
                Admin
              </Link>
            )}
          </div>

          {/* User Actions & Mobile Toggle */}
          <div className="flex items-center gap-2 md:gap-4">
            <div className="hidden sm:flex items-center gap-4">
              {userEmail ? (
                <div className="flex items-center gap-3">
                  <div className="hidden lg:flex flex-col items-end leading-none mr-2">
                    <span className="text-[9px] font-black opacity-30 tracking-[0.2em] uppercase">Connecté</span>
                    <span className="text-[10px] font-bold opacity-60 truncate max-w-[120px]">{userEmail}</span>
                  </div>
                  
                  <Link href="/settings">
                    <NeonButton variant="secondary" className="px-5 py-2.5 text-[10px] tracking-[0.2em]">
                      <User size={14} className="mr-2" />
                      MON COMPTE
                    </NeonButton>
                  </Link>

                  <button 
                    onClick={handleLogout}
                    className="p-2.5 rounded-xl border border-white/10 hover:bg-red-500/10 hover:border-red-500/30 text-slate-400 hover:text-red-500 transition-all flex items-center gap-2 group"
                    title="Déconnexion"
                  >
                    <LogOut size={16} className="group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Link href="/auth/login">
                    <button className="px-4 py-2 text-xs font-black hover:text-accent transition-colors uppercase tracking-widest">
                      Connexion
                    </button>
                  </Link>
                  <Link href="/leagues/create">
                    <NeonButton variant="primary" className="px-6 py-2.5 text-[10px] tracking-[0.2em]">
                      <UserPlus size={14} className="mr-2" />
                      CRÉER UNE LIGUE
                    </NeonButton>
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-xl glass glass-hover"
            >
              {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {isMenuOpen && (
          <div className="md:hidden mt-2 bg-slate-950 border border-white/10 rounded-2xl p-6 flex flex-col gap-6 animate-in fade-in slide-in-from-top-2 shadow-2xl z-50">
            {/* Logo en gros dans le menu mobile */}
            <div className="flex flex-col items-center gap-4 py-6">
              <div className="relative w-32 h-32 md:w-40 md:h-40 overflow-hidden rounded-3xl border-4 border-accent/40 shadow-2xl shadow-accent/20 transform hover:scale-105 transition-transform duration-500">
                <Image
                  src="/logo.png"
                  alt="GTR-Pickelball Logo"
                  fill
                  className="object-cover"
                />
              </div>
              <span className="font-extrabold text-3xl tracking-tight text-gradient mt-2">
                GTR-Pickelball
              </span>
            </div>

            <div className="h-px bg-white/10 w-full" />

            <Link 
              href="/leagues" 
              onClick={() => setIsMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 active:bg-white/10 transition-colors text-lg"
            >
              Mes Ligues
            </Link>

            {isAdmin && (
              <Link 
                href="/admin" 
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 active:bg-white/10 transition-colors text-lg text-pickle-muted"
              >
                <ShieldCheck size={20} />
                Administration
              </Link>
            )}
            
            <div className="h-px bg-white/10 w-full" />
            
            <div className="flex flex-col gap-3">
              {userEmail ? (
                <>
                  <Link href="/settings" onClick={() => setIsMenuOpen(false)}>
                    <button className="w-full bg-slate-800 text-white py-4 rounded-xl font-bold border border-white/10 flex items-center justify-center gap-3">
                      <User size={18} />
                      Mon Compte
                    </button>
                  </Link>
                  <button 
                    onClick={() => {
                      setIsMenuOpen(false);
                      handleLogout();
                    }}
                    className="w-full bg-red-500/10 text-red-500 py-4 rounded-xl font-bold border border-red-500/20 flex items-center justify-center gap-3"
                  >
                    <LogOut size={18} />
                    Déconnexion
                  </button>
                </>
              ) : (
                <>
                  <Link href="/auth/login" onClick={() => setIsMenuOpen(false)}>
                    <button className="w-full text-center py-4 rounded-xl border border-white/10 font-semibold">
                      Connexion
                    </button>
                  </Link>
                  <Link href="/leagues/create" onClick={() => setIsMenuOpen(false)}>
                    <button className="w-full bg-accent text-accent-foreground py-4 rounded-xl font-bold shadow-lg shadow-accent/20">
                      Démarrer une ligue
                    </button>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>
    </>
  );
};
