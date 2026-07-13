"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Users,
  Calendar,
  Settings,
  LayoutDashboard,
  ChevronLeft,
  Trophy,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface LeagueNavProps {
  leagueId: string;
}

/**
 * Nav ligue — P1 : actif = accent discret (pas de glow fort).
 */
export function LeagueNav({ leagueId }: LeagueNavProps) {
  const pathname = usePathname();

  const navItems = [
    { name: "Vue d'ensemble", href: `/leagues/${leagueId}`, icon: LayoutDashboard },
    { name: "Hall of Fame", href: `/leagues/${leagueId}/hall-of-fame`, icon: Trophy },
    { name: "Joueurs", href: `/leagues/${leagueId}/players`, icon: Users },
    { name: "Sessions", href: `/leagues/${leagueId}/sessions`, icon: Calendar },
    { name: "Paramètres", href: `/leagues/${leagueId}/settings`, icon: Settings },
  ];

  const isSubPage = pathname !== `/leagues/${leagueId}`;
  let backHref = "/leagues";
  let backLabel = "Retour aux ligues";

  if (isSubPage) {
    if (pathname.includes("/sessions/")) {
      backHref = `/leagues/${leagueId}/sessions`;
      backLabel = "Retour aux sessions";
    } else {
      backHref = `/leagues/${leagueId}`;
      backLabel = "Retour à la ligue";
    }
  }

  return (
    <div className="space-y-5">
      <Link
        href={backHref}
        className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors group"
      >
        <div className="p-1.5 rounded-lg bg-white/5 group-hover:bg-white/10 transition-all">
          <ChevronLeft className="w-4 h-4" />
        </div>
        <span className="text-sm font-medium">{backLabel}</span>
      </Link>

      <div className="flex flex-wrap gap-1 p-1 bg-slate-900/60 border border-white/10 rounded-xl w-fit max-w-full">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-white/10 text-white border border-pickle-primary/40"
                  : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent"
              )}
            >
              <item.icon
                className={cn(
                  "w-4 h-4",
                  isActive ? "text-pickle-primary" : "text-slate-500"
                )}
              />
              <span className="whitespace-nowrap">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
