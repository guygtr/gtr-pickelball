"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";

interface NavbarProps {
  userEmail?: string;
}

/**
 * Composant Navbar avec effet Glassmorphism et Menu Mobile.
 */
export const Navbar = ({ userEmail }: NavbarProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <>
      <nav className="fixed top-2 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-7xl">
        <div className="glass px-4 md:px-6 py-3 md:py-4 rounded-2xl flex items-center justify-between shadow-lg">
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
            <Link href="/leagues" className="hover:text-accent transition-colors">Ligues</Link>
            <Link href="/players" className="hover:text-accent transition-colors">Joueurs</Link>
            <Link href="/sessions" className="hover:text-accent transition-colors">Sessions</Link>
          </div>

          {/* User Actions & Mobile Toggle */}
          <div className="flex items-center gap-2 md:gap-4">
            <div className="hidden sm:flex items-center gap-4">
              {userEmail ? (
                <div className="flex items-center gap-4">
                  <span className="text-sm opacity-60 hidden lg:block">{userEmail}</span>
                  <button className="glass glass-hover px-4 py-2 rounded-xl text-sm font-semibold text-accent">
                    Mon Compte
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link href="/auth/login">
                    <button className="px-4 py-2 text-sm font-semibold hover:opacity-80 transition-opacity">
                      Connexion
                    </button>
                  </Link>
                  <Link href="/auth/register">
                    <button className="bg-accent text-accent-foreground px-5 py-2 rounded-xl text-sm font-bold shadow-md hover:shadow-accent/40 transition-all active:scale-95">
                      Rejoindre
                    </button>
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
          <div className="md:hidden mt-2 glass rounded-2xl p-4 flex flex-col gap-4 animate-in fade-in slide-in-from-top-2">
            <Link 
              href="/leagues" 
              onClick={() => setIsMenuOpen(false)}
              className="px-4 py-2 rounded-xl hover:bg-white/5 active:bg-white/10 transition-colors"
            >
              Ligues
            </Link>
            <Link 
              href="/players" 
              onClick={() => setIsMenuOpen(false)}
              className="px-4 py-2 rounded-xl hover:bg-white/5 active:bg-white/10 transition-colors"
            >
              Joueurs
            </Link>
            <Link 
              href="/sessions" 
              onClick={() => setIsMenuOpen(false)}
              className="px-4 py-2 rounded-xl hover:bg-white/5 active:bg-white/10 transition-colors"
            >
              Sessions
            </Link>
            <div className="h-px bg-white/10 my-2" />
            <div className="flex flex-col gap-2">
              <Link href="/auth/login" onClick={() => setIsMenuOpen(false)}>
                <button className="w-full text-center py-3 rounded-xl border border-white/10">
                  Connexion
                </button>
              </Link>
              <Link href="/auth/register" onClick={() => setIsMenuOpen(false)}>
                <button className="w-full bg-accent text-accent-foreground py-3 rounded-xl font-bold">
                  Rejoindre
                </button>
              </Link>
            </div>
          </div>
        )}
      </nav>
    </>
  );
};
