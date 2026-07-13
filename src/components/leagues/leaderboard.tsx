"use client";

import { PlayerRank } from "@/lib/domain/stats";
import { GlassCard } from "@/components/ui/gtr/glass-card";
import { Trophy, Medal, Star, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

interface LeaderboardProps {
  rankings: PlayerRank[];
}

/**
 * Classement — Option B : podium calme, liste lisible.
 */
export function Leaderboard({ rankings }: LeaderboardProps) {
  const [showAll, setShowAll] = useState(false);

  const top3 = rankings.slice(0, 3);
  const theRest = rankings.slice(3, showAll ? undefined : 8);
  const hasMore = rankings.length > 8;

  if (rankings.length === 0) return null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 px-1">
        {top3[1] && (
          <div className="order-2 md:order-1 flex flex-col items-center justify-end">
            <div className="relative mb-3">
              <div className="w-16 h-16 rounded-full bg-slate-500/15 border border-slate-400/25 flex items-center justify-center">
                <span className="text-white font-semibold text-lg">
                  {top3[1].firstName[0]}
                  {top3[1].lastName[0]}
                </span>
              </div>
              <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-slate-600 border border-slate-900 flex items-center justify-center">
                <Medal className="w-3.5 h-3.5 text-slate-100" />
              </div>
            </div>
            <p className="text-sm font-semibold text-white text-center">
              {top3[1].name}
            </p>
            <p className="text-xs text-slate-500">
              {top3[1].winRate.toFixed(0)} % victoires
            </p>
            <div className="w-full h-12 mt-2 bg-white/[0.03] border border-white/5 rounded-t-xl flex items-center justify-center">
              <span className="text-xl font-semibold text-slate-500">2</span>
            </div>
          </div>
        )}

        {top3[0] && (
          <div className="order-1 md:order-2 flex flex-col items-center justify-end md:-translate-y-2">
            <div className="relative mb-3">
              <div className="absolute -top-6 left-1/2 -translate-x-1/2">
                <Trophy className="w-6 h-6 text-pickle-muted" />
              </div>
              <div className="w-20 h-20 rounded-full bg-pickle-muted/15 border border-pickle-muted/35 flex items-center justify-center">
                <span className="text-white font-semibold text-2xl">
                  {top3[0].firstName[0]}
                  {top3[0].lastName[0]}
                </span>
              </div>
              <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-pickle-muted border border-slate-900 flex items-center justify-center">
                <Star className="w-4 h-4 text-white fill-white" />
              </div>
            </div>
            <p className="text-base font-semibold text-white text-center">
              {top3[0].name}
            </p>
            <p className="text-xs text-pickle-muted font-medium">
              {top3[0].winRate.toFixed(0)} % · {top3[0].wins} V
            </p>
            <div className="w-full h-16 mt-2 bg-pickle-muted/10 border border-pickle-muted/20 rounded-t-2xl flex items-center justify-center">
              <span className="text-2xl font-semibold text-pickle-muted/70">
                1
              </span>
            </div>
          </div>
        )}

        {top3[2] && (
          <div className="order-3 flex flex-col items-center justify-end">
            <div className="relative mb-3">
              <div className="w-16 h-16 rounded-full bg-amber-800/15 border border-amber-700/30 flex items-center justify-center">
                <span className="text-white font-semibold text-lg">
                  {top3[2].firstName[0]}
                  {top3[2].lastName[0]}
                </span>
              </div>
              <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-amber-800 border border-slate-900 flex items-center justify-center">
                <Medal className="w-3.5 h-3.5 text-amber-100" />
              </div>
            </div>
            <p className="text-sm font-semibold text-white text-center">
              {top3[2].name}
            </p>
            <p className="text-xs text-slate-500">
              {top3[2].winRate.toFixed(0)} % victoires
            </p>
            <div className="w-full h-10 mt-2 bg-white/[0.03] border border-white/5 rounded-t-xl flex items-center justify-center">
              <span className="text-lg font-semibold text-amber-700/60">3</span>
            </div>
          </div>
        )}
      </div>

      <GlassCard className="p-0 overflow-hidden" hoverEffect={false}>
        <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
          <h4 className="text-sm font-medium text-slate-400">Classement</h4>
          <div className="flex gap-4 text-xs text-slate-500">
            <span className="w-8 text-center">J</span>
            <span className="w-8 text-center">V</span>
            <span className="w-10 text-right">%</span>
          </div>
        </div>

        <div className="divide-y divide-white/5">
          {theRest.length > 0 ? (
            theRest.map((rank, idx) => (
              <div
                key={rank.id}
                className="flex items-center justify-between px-4 py-3 hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-6 text-xs font-medium text-slate-600 text-center">
                    {idx + 4}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-[10px] font-medium text-slate-400 shrink-0">
                    {rank.firstName[0]}
                    {rank.lastName[0]}
                  </div>
                  <p className="text-sm font-medium text-white truncate">
                    {rank.name}
                  </p>
                </div>
                <div className="flex items-center gap-4 text-sm tabular-nums shrink-0">
                  <span className="w-8 text-center text-slate-500">
                    {rank.matchesPlayed}
                  </span>
                  <span className="w-8 text-center font-medium text-pickle-primary">
                    {rank.wins}
                  </span>
                  <span className="w-10 text-right font-medium text-white">
                    {rank.winRate.toFixed(0)}%
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-slate-500 text-sm">
              En attente d&apos;autres résultats…
            </div>
          )}
        </div>

        {hasMore && (
          <button
            type="button"
            onClick={() => setShowAll(!showAll)}
            className="w-full p-3.5 text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-colors flex items-center justify-center gap-2"
          >
            {showAll ? (
              <>
                Voir moins <ChevronUp className="w-4 h-4" />
              </>
            ) : (
              <>
                Voir tout le classement <ChevronDown className="w-4 h-4" />
              </>
            )}
          </button>
        )}
      </GlassCard>
    </div>
  );
}
