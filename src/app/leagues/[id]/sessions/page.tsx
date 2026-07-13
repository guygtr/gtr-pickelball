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

  const league = await prisma.league.findUnique({
    where: { id: resolvedParams.id },
    select: { settings: true },
  });

  const sessions = await prisma.session.findMany({
    where: { leagueId: resolvedParams.id },
    include: {
      matches: {
        select: { data: true },
      },
      _count: {
        select: { matches: true },
      },
    },
    orderBy: { date: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-semibold text-white tracking-tight flex items-center gap-2">
            <Calendar className="w-6 h-6 text-pickle-primary" />
            Sessions
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Planifiez, puis ouvrez le jour de match sur le terrain.
          </p>
        </div>
        <SessionListClient
          leagueId={resolvedParams.id}
          leagueSettings={league?.settings as Record<string, unknown>}
        />
      </div>

      <SessionsViewToggle sessions={sessions} leagueId={resolvedParams.id} />
    </div>
  );
}
