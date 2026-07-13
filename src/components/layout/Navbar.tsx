"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu, X, ShieldCheck, User, UserPlus, LogOut } from "lucide-react";
import { NeonButton } from "@/components/ui/gtr/neon-button";
import { signOut } from "@/actions/auth";

interface NavbarProps {
  userEmail?: string;
  isAdmin?: boolean;
}

/**
 * Navbar — P1 UI : un seul CTA primary, actions secondaires discrètes.
 * Rollback : git revert du commit style(ui): P1
 */
export const Navbar = ({ userEmail, isAdmin }: NavbarProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <>
      <nav className="fixed top-2 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-7xl">
        <div className="bg-slate-950/95 backdrop-blur-md border border-white/10 px-4 md:px-5 py-2.5 md:py-3 rounded-2xl flex items-center justify-between shadow-xl">
          <Link href="/" className="flex items-center gap-2 md:gap-3 group">
            <div className="relative w-8 h-8 md:w-9 md:h-9 overflow-hidden rounded-lg border border-white/15">
              <Image
                src="/logo.png"
                alt="GTR-Pickelball Logo"
                fill
                className="object-cover"
              />
            </div>
            <span className="font-semibold text-base md:text-lg tracking-tight text-white">
              GTR<span className="text-pickle-primary">·</span>Pickelball
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
            <Link
              href="/leagues"
              className="hover:text-white transition-colors"
            >
              Mes ligues
            </Link>
            {isAdmin && (
              <Link
                href="/admin"
                className="hover:text-white transition-colors flex items-center gap-1.5 text-slate-400"
              >
                <ShieldCheck size={16} />
                Admin
              </Link>
            )}
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            <div className="hidden sm:flex items-center gap-2">
              {userEmail ? (
                <>
                  <span className="hidden lg:block text-xs text-slate-500 truncate max-w-[140px]">
                    {userEmail}
                  </span>
                  <Link
                    href="/settings"
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 border border-white/10 hover:bg-white/5 hover:text-white transition-colors"
                  >
                    <User size={14} />
                    Compte
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="p-2 rounded-xl border border-white/10 hover:bg-red-500/10 hover:border-red-500/30 text-slate-400 hover:text-red-400 transition-all"
                    title="Déconnexion"
                    type="button"
                  >
                    <LogOut size={16} />
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/auth/login"
                    className="px-3 py-2 text-xs font-medium text-slate-300 hover:text-white transition-colors"
                  >
                    Connexion
                  </Link>
                  <Link href="/leagues/create">
                    <NeonButton variant="primary" className="px-4 py-2 text-[10px]">
                      <UserPlus size={14} className="mr-1.5" />
                      Créer une ligue
                    </NeonButton>
                  </Link>
                </>
              )}
            </div>

            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-xl border border-white/10 hover:bg-white/5"
              type="button"
              aria-label="Menu"
            >
              {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {isMenuOpen && (
          <div className="md:hidden mt-2 bg-slate-950 border border-white/10 rounded-2xl p-5 flex flex-col gap-3 shadow-2xl z-50">
            <Link
              href="/leagues"
              onClick={() => setIsMenuOpen(false)}
              className="px-4 py-3 rounded-xl hover:bg-white/5 text-sm font-medium"
            >
              Mes ligues
            </Link>
            {isAdmin && (
              <Link
                href="/admin"
                onClick={() => setIsMenuOpen(false)}
                className="px-4 py-3 rounded-xl hover:bg-white/5 text-sm font-medium text-slate-300 flex items-center gap-2"
              >
                <ShieldCheck size={18} />
                Administration
              </Link>
            )}
            <div className="h-px bg-white/10" />
            {userEmail ? (
              <>
                <Link href="/settings" onClick={() => setIsMenuOpen(false)}>
                  <button
                    type="button"
                    className="w-full bg-white/5 text-white py-3 rounded-xl font-medium border border-white/10 flex items-center justify-center gap-2 text-sm"
                  >
                    <User size={16} />
                    Mon compte
                  </button>
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    handleLogout();
                  }}
                  className="w-full bg-red-500/10 text-red-400 py-3 rounded-xl font-medium border border-red-500/20 flex items-center justify-center gap-2 text-sm"
                >
                  <LogOut size={16} />
                  Déconnexion
                </button>
              </>
            ) : (
              <>
                <Link href="/auth/login" onClick={() => setIsMenuOpen(false)}>
                  <button
                    type="button"
                    className="w-full py-3 rounded-xl border border-white/10 font-medium text-sm"
                  >
                    Connexion
                  </button>
                </Link>
                <Link href="/leagues/create" onClick={() => setIsMenuOpen(false)}>
                  <NeonButton variant="primary" className="w-full py-3">
                    Démarrer une ligue
                  </NeonButton>
                </Link>
              </>
            )}
          </div>
        )}
      </nav>
    </>
  );
};
