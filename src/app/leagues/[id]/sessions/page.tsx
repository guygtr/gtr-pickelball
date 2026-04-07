import { prisma } from "@/lib/prisma";
import { Calendar } from "lucide-react";
import { SessionListClient } from "@/components/sessions/session-list-client";
import { SessionsViewToggle } from "@/components/sessions/sessions-view-toggle";

export default async function SessionsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const sessions = await prisma.session.findMany({
    where: { leagueId: resolvedParams.id },
    include: {
      matches: {
        select: { data: true }
      },
      _count: {
        select: { matches: true }
      }
    },
    orderBy: { date: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Calendar className="w-6 h-6 text-pickle-blue" />
          Sessions de Jeu
        </h2>
        <SessionListClient leagueId={resolvedParams.id} />
      </div>

      <SessionsViewToggle sessions={sessions} leagueId={resolvedParams.id} />
    </div>
  );
}
