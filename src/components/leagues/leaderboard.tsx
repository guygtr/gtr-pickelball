"use client";

import { PlayerRank } from "@/lib/domain/stats";
import { GlassCard } from "@/components/ui/gtr/glass-card";
import { Trophy, Medal, Star, ChevronDown, ChevronUp, User } from "lucide-react";
import { useState } from "react";

interface LeaderboardProps {
  rankings: PlayerRank[];
}

export function Leaderboard({ rankings }: LeaderboardProps) {
  const [showAll, setShowAll] = useState(false);
  
  const top3 = rankings.slice(0, 3);
  const theRest = rankings.slice(3, showAll ? undefined : 8);
  const hasMore = rankings.length > 8;

  if (rankings.length === 0) return null;

  return (
    <div className="space-y-8">
      {/* SECTION PODIUM */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-10 px-4">
        {/* SECOND PLACE */}
        {top3[1] && (
          <div className="order-2 md:order-1 flex flex-col items-center justify-end animate-fade-in-up [animation-delay:150ms]">
            <div className="relative mb-4">
              <div className="w-20 h-20 rounded-full bg-slate-400/20 border-2 border-slate-400/30 flex items-center justify-center p-1 overflow-hidden ring-4 ring-slate-400/10">
                <div className="w-full h-full rounded-full bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center text-white font-black text-xl">
                  {top3[1].firstName[0]}{top3[1].lastName[0]}
                </div>
              </div>
              <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-slate-500 border-2 border-slate-900 flex items-center justify-center shadow-lg">
                <Medal className="w-4 h-4 text-slate-100" />
              </div>
            </div>
            <div className="text-center mb-2">
              <p className="text-sm font-black text-white uppercase tracking-tight">{top3[1].name}</p>
              <p className="text-[10px] font-bold text-slate-500 tracking-widest uppercase">{top3[1].winRate.toFixed(0)}% WIN RATE</p>
            </div>
            <div className="w-full h-16 bg-slate-400/5 border-t border-x border-white/5 rounded-t-2xl flex items-center justify-center">
              <span className="text-2xl font-black text-slate-400/40 italic">2</span>
            </div>
          </div>
        )}

        {/* FIRST PLACE */}
        {top3[0] && (
          <div className="order-1 md:order-2 flex flex-col items-center justify-end -translate-y-4 animate-fade-in-up">
            <div className="relative mb-6">
              {/* Crown Icon Above */}
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 animate-bounce">
                <Trophy className="w-8 h-8 text-pickle-muted fill-pickle-muted/20 drop-shadow-[0_0_15px_rgba(249,115,22,0.5)]" />
              </div>
              
              <div className="w-28 h-28 rounded-full bg-pickle-muted/20 border-2 border-pickle-muted/50 flex items-center justify-center p-1.5 overflow-hidden ring-8 ring-pickle-muted/10 shadow-[0_0_50px_rgba(249,115,22,0.2)]">
                <div className="w-full h-full rounded-full bg-gradient-to-br from-pickle-muted to-yellow-500 flex items-center justify-center text-white font-black text-3xl">
                  {top3[0].firstName[0]}{top3[0].lastName[0]}
                </div>
              </div>
              <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-pickle-muted border-2 border-slate-900 flex items-center justify-center shadow-xl">
                <Star className="w-5 h-5 text-white fill-white" />
              </div>
            </div>
            <div className="text-center mb-4">
              <h4 className="text-lg font-black text-white uppercase tracking-tighter glow-text-white">{top3[0].name}</h4>
              <p className="text-xs font-black text-pickle-muted tracking-widest uppercase">{top3[0].winRate.toFixed(0)}% WIN RATE</p>
            </div>
            <div className="w-full h-24 bg-pickle-muted/10 border-t border-x border-pickle-muted/20 rounded-t-3xl flex flex-col items-center justify-center relative overflow-hidden group">
               <div className="absolute inset-0 bg-gradient-to-t from-pickle-muted/20 to-transparent opacity-50" />
               <span className="text-4xl font-black text-pickle-muted/40 italic relative z-10">1</span>
               <span className="text-[10px] font-black text-pickle-muted/60 uppercase tracking-widest relative z-10">{top3[0].wins} VICTOIRES</span>
            </div>
          </div>
        )}

        {/* THIRD PLACE */}
        {top3[2] && (
          <div className="order-3 flex flex-col items-center justify-end animate-fade-in-up [animation-delay:300ms]">
            <div className="relative mb-4">
              <div className="w-20 h-20 rounded-full bg-amber-700/20 border-2 border-amber-700/40 flex items-center justify-center p-1 overflow-hidden ring-4 ring-amber-700/10">
                <div className="w-full h-full rounded-full bg-gradient-to-br from-amber-600 to-amber-900 flex items-center justify-center text-white font-black text-xl">
                  {top3[2].firstName[0]}{top3[2].lastName[0]}
                </div>
              </div>
              <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-amber-800 border-2 border-slate-900 flex items-center justify-center shadow-lg">
                <Medal className="w-4 h-4 text-amber-100" />
              </div>
            </div>
            <div className="text-center mb-2">
              <p className="text-sm font-black text-white uppercase tracking-tight">{top3[2].name}</p>
              <p className="text-[10px] font-bold text-slate-500 tracking-widest uppercase">{top3[2].winRate.toFixed(0)}% WIN RATE</p>
            </div>
            <div className="w-full h-12 bg-amber-800/10 border-t border-x border-white/5 rounded-t-xl flex items-center justify-center">
              <span className="text-xl font-black text-amber-700/40 italic">3</span>
            </div>
          </div>
        )}
      </div>

      {/* LISTE DES AUTRES */}
      <GlassCard className="p-0 overflow-hidden border-white/5">
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
           <h4 className="text-[10px] font-black text-slate-500 tracking-[0.3em] uppercase">Classement Complet</h4>
           <div className="flex gap-4 text-[9px] font-bold text-slate-600 tracking-widest uppercase">
              <span>Joués</span>
              <span className="w-10 text-center">Wins</span>
              <span className="w-10 text-right">Rate</span>
           </div>
        </div>
        
        <div className="divide-y divide-white/5">
          {theRest.length > 0 ? (
            theRest.map((rank, idx) => (
              <div key={rank.id} className="flex items-center justify-between p-4 hover:bg-white/[0.03] transition-colors">
                <div className="flex items-center gap-4">
                  <span className="w-4 text-[10px] font-black text-slate-600 text-center italic">#{idx + 4}</span>
                  <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-400">
                    {rank.firstName[0]}{rank.lastName[0]}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white uppercase tracking-tight">{rank.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs font-mono">
                   <span className="text-slate-500">{rank.matchesPlayed}</span>
                   <span className="w-10 text-center font-bold text-pickle-primary">{rank.wins}</span>
                   <span className="w-10 text-right font-black text-white">{rank.winRate.toFixed(0)}%</span>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-slate-600 text-[10px] font-bold uppercase tracking-widest">
               En attente d'autres résultats...
            </div>
          )}
        </div>

        {hasMore && (
          <button 
            onClick={() => setShowAll(!showAll)}
            className="w-full p-4 text-[10px] font-black text-slate-500 hover:text-white hover:bg-white/5 transition-all flex items-center justify-center gap-2 uppercase tracking-[0.2em]"
          >
            {showAll ? (
              <>VOIR MOINS <ChevronUp className="w-3 h-3" /></>
            ) : (
              <>VOIR LE CLASSEMENT COMPLET <ChevronDown className="w-3 h-3" /></>
            )}
          </button>
        )}
      </GlassCard>
    </div>
  );
}
