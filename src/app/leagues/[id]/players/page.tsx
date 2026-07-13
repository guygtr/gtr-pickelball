import { prisma } from "@/lib/prisma";
import { Player, Prisma } from "@prisma/client";
import { Users, Filter } from "lucide-react";
import { PlayerListClient } from "@/components/players/player-list-client";
import { GlassCard } from "@/components/ui/gtr/glass-card";
import { PlayerActions } from "@/components/players/player-actions";
import { NeonButton } from "@/components/ui/gtr/neon-button";
import { PlayerSearch } from "@/components/players/player-search";
import Link from "next/link";

export default async function PlayersPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ sort?: string; q?: string; dir?: "asc" | "desc" }>;
}) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const sort = resolvedSearchParams.sort || "name";
  const query = resolvedSearchParams.q || "";
  const dir = resolvedSearchParams.dir || (sort === "level" ? "desc" : "asc");

  // Logic pour le tri stable (toujours inclure le nom en secondaire)
  let orderBy: Prisma.PlayerOrderByWithRelationInput[] = [{ lastName: dir }, { firstName: dir }];
  if (sort === "level") orderBy = [{ skillLevel: dir }, { lastName: "asc" }];
  if (sort === "type") orderBy = [{ type: dir }, { lastName: "asc" }];

  const players = await prisma.player.findMany({
    where: { 
      leagueId: resolvedParams.id,
      OR: query ? [
        { firstName: { contains: query, mode: 'insensitive' } },
        { lastName: { contains: query, mode: 'insensitive' } },
        { email: { contains: query, mode: 'insensitive' } },
      ] : undefined
    },
    orderBy,
  });

  const getSortLink = (newSort: string) => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    
    let newDir: "asc" | "desc" = "asc";
    if (newSort === sort) {
      newDir = dir === "asc" ? "desc" : "asc";
    } else if (newSort === "level") {
      newDir = "desc";
    }
    
    params.set("sort", newSort);
    params.set("dir", newDir);
    return `?${params.toString()}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-pickle-primary" />
            Gestion des Joueurs
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            {players.length} joueurs trouvés {query ? `pour "${query}"` : ""}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <PlayerListClient leagueId={resolvedParams.id} />
        </div>
      </div>

      <GlassCard className="overflow-hidden">
        <div className="p-4 border-b border-white/5 bg-white/5 flex flex-col sm:flex-row gap-4 justify-between">
          <PlayerSearch />
          <NeonButton variant="secondary" className="py-2 text-[10px]">
            <Filter className="w-4 h-4 flex-shrink-0" />
            FILTRER
          </NeonButton>
        </div>

        {/* Mobile : cards */}
        <div className="md:hidden divide-y divide-white/10">
          {players.map((player: Player) => {
            const pType = (player.type === "remplacant" ? "remplacant" : "permanent") as
              | "permanent"
              | "remplacant";
            return (
              <div key={player.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-10 h-10 rounded-full bg-gradient-to-br from-pickle-primary to-pickle-secondary flex items-center justify-center text-pickle-dark text-xs font-bold shrink-0"
                      aria-hidden
                    >
                      {player.firstName[0]}
                      {player.lastName[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="text-white font-semibold truncate">
                        {player.firstName} {player.lastName}
                      </p>
                      <p className="text-sm text-slate-300 truncate">
                        {player.email || player.phone || "Sans contact"}
                      </p>
                    </div>
                  </div>
                  <PlayerActions
                    leagueId={resolvedParams.id}
                    player={{ ...player, type: pType }}
                  />
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span
                    className={`px-2 py-1 rounded-md border font-semibold uppercase tracking-wide ${
                      pType === "permanent"
                        ? "bg-pickle-secondary/15 border-pickle-secondary/40 text-red-200"
                        : "bg-pickle-muted/15 border-pickle-muted/40 text-lime-200"
                    }`}
                  >
                    {pType === "permanent" ? "Permanent" : "Remplaçant"}
                  </span>
                  <span className="px-2 py-1 rounded-md bg-white/10 border border-white/15 text-white font-mono font-semibold">
                    Niv. {player.skillLevel.toFixed(1)}
                  </span>
                  <span className="px-2 py-1 rounded-md bg-pickle-primary/15 border border-pickle-primary/30 text-pickle-primary font-mono font-semibold">
                    IA{" "}
                    {player.aiLevel
                      ? player.aiLevel.toFixed(2)
                      : player.skillLevel.toFixed(2)}
                  </span>
                </div>
              </div>
            );
          })}
          {players.length === 0 && (
            <p className="px-6 py-16 text-center text-slate-300 text-sm">
              Aucun joueur trouvé
            </p>
          )}
        </div>

        {/* Desktop : table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                <th className="px-6 py-4">
                  <Link
                    href={getSortLink("name")}
                    className={`hover:text-pickle-primary transition-colors flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pickle-primary rounded ${sort === "name" ? "text-pickle-primary" : ""}`}
                  >
                    Joueur {sort === "name" && (dir === "asc" ? "↑" : "↓")}
                  </Link>
                </th>
                <th className="px-6 py-4">
                  <Link
                    href={getSortLink("type")}
                    className={`hover:text-pickle-primary transition-colors flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pickle-primary rounded ${sort === "type" ? "text-pickle-primary" : ""}`}
                  >
                    Type {sort === "type" && (dir === "asc" ? "↑" : "↓")}
                  </Link>
                </th>
                <th className="px-6 py-4">
                  <Link
                    href={getSortLink("level")}
                    className={`hover:text-pickle-primary transition-colors flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pickle-primary rounded ${sort === "level" ? "text-pickle-primary" : ""}`}
                  >
                    Niveau {sort === "level" && (dir === "asc" ? "↑" : "↓")}
                  </Link>
                </th>
                <th className="px-6 py-4 text-pickle-primary">IA</th>
                <th className="px-6 py-4 text-slate-300">Contact</th>
                <th className="px-6 py-4 text-right text-slate-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {players.map((player: Player) => (
                <tr
                  key={player.id}
                  className="group hover:bg-white/[0.03] transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pickle-primary to-pickle-secondary flex items-center justify-center text-pickle-dark text-[10px] font-bold">
                        {player.firstName[0]}
                        {player.lastName[0]}
                      </div>
                      <span className="text-white font-semibold">
                        {player.firstName} {player.lastName}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest border ${
                        player.type === "permanent"
                          ? "bg-pickle-secondary/10 border-pickle-secondary/30 text-red-200"
                          : "bg-pickle-muted/10 border-pickle-muted/30 text-lime-200"
                      }`}
                    >
                      {player.type === "permanent" ? "Permanent" : "Remplaçant"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 rounded-md bg-white/10 border border-white/15 text-white text-xs font-bold font-mono">
                      {player.skillLevel.toFixed(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded-md font-mono text-xs font-bold ${
                        player.aiLevel
                          ? "bg-pickle-primary/10 border border-pickle-primary/20 text-pickle-primary"
                          : "bg-white/10 border border-white/15 text-slate-300"
                      }`}
                    >
                      {player.aiLevel
                        ? player.aiLevel.toFixed(3)
                        : player.skillLevel.toFixed(3)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-300 text-[11px]">
                    {player.email || player.phone || "-"}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <PlayerActions
                      leagueId={resolvedParams.id}
                      player={{
                        ...player,
                        type: (player.type === "remplacant"
                          ? "remplacant"
                          : "permanent") as "permanent" | "remplacant",
                      }}
                    />
                  </td>
                </tr>
              ))}
              {players.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-20 text-center text-slate-300 text-sm"
                  >
                    Aucun joueur trouvé
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}
