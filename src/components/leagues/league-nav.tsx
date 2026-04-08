"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, Calendar, Settings, LayoutDashboard, ChevronLeft, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

interface LeagueNavProps {
  leagueId: string;
}

export function LeagueNav({ leagueId }: LeagueNavProps) {
  const pathname = usePathname();

  const navItems = [
    { name: "Vue d'ensemble", href: `/leagues/${leagueId}`, icon: LayoutDashboard },
    { name: "Hall of Fame", href: `/leagues/${leagueId}/hall-of-fame`, icon: Trophy },
    { name: "Joueurs", href: `/leagues/${leagueId}/players`, icon: Users },
    { name: "Sessions", href: `/leagues/${leagueId}/sessions`, icon: Calendar },
    { name: "Paramètres", href: `/leagues/${leagueId}/settings`, icon: Settings },
  ];

  // Logic for the back button
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
    <div className="space-y-6">
      {/* Back Button */}
      <Link 
        href={backHref}
        className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors group mb-2"
      >
        <div className="p-1.5 rounded-lg bg-white/5 group-hover:bg-white/10 transition-all">
          <ChevronLeft className="w-4 h-4" />
        </div>
        <span className="text-sm font-medium">{backLabel}</span>
      </Link>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl w-fit">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 group relative overflow-hidden",
                isActive 
                  ? "bg-white/15 text-pickle-green shadow-[0_0_15px_rgba(132,204,22,0.3)] ring-1 ring-white/20" 
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              )}
            >
              <item.icon className={cn("w-4 h-4 transition-transform group-hover:scale-110", isActive ? "text-pickle-green" : "text-slate-400 group-hover:text-white")} />
              {item.name}
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-pickle-green shadow-[0_0_8px_rgba(132,204,22,0.8)]" />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
