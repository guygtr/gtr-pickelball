import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { LeagueNav } from "@/components/leagues/league-nav";
import { z } from "zod";

const leagueIdSchema = z.string().cuid("Identifiant de ligue invalide.");

export default async function LeagueLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;

  // Validation du format de l'identifiant (CUID) avant toute requête DB
  const parsedId = leagueIdSchema.safeParse(resolvedParams.id);
  if (!parsedId.success) {
    notFound();
  }

  const league = await prisma.league.findUnique({
    where: { id: parsedId.data },
  });

  if (!league) {
    notFound();
  }


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
              Ligue active • {league.description || "Aucune description"}
            </p>
          </div>
        </div>

        {/* Navigation & Back Button */}
        <LeagueNav leagueId={resolvedParams.id} />

        {/* Dynamic Content */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          {children}
        </div>
      </div>
    </div>
  );
}
