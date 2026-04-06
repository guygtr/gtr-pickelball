import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Users, Calendar, Settings, LayoutDashboard } from "lucide-react";

export default async function LeagueLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const league = await prisma.league.findUnique({
    where: { id: resolvedParams.id },
  });

  if (!league) {
    notFound();
  }

  const navItems = [
    { name: "Vue d'ensemble", href: `/leagues/${resolvedParams.id}`, icon: LayoutDashboard },
    { name: "Joueurs", href: `/leagues/${resolvedParams.id}/players`, icon: Users },
    { name: "Sessions", href: `/leagues/${resolvedParams.id}/sessions`, icon: Calendar },
    { name: "Paramètres", href: `/leagues/${resolvedParams.id}/settings`, icon: Settings },
  ];

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-white tracking-tight">
              {league.name}
            </h1>
            <p className="text-slate-400 mt-2">
              Ligue de Pickleball active • {league.description || "Aucune description"}
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 p-1 bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl w-fit">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 hover:bg-white/5 text-slate-300 hover:text-white group [&.active]:bg-emerald-500 [&.active]:text-white"
            >
              <item.icon className="w-4 h-4" />
              {item.name}
            </Link>
          ))}
        </div>

        {/* Dynamic Content */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          {children}
        </div>
      </div>
    </div>
  );
}
