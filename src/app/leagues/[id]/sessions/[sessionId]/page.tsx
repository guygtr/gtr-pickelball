import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { MapPin } from "lucide-react";
import { SessionDetailsClient } from "@/components/sessions/session-details-client";
import { getSessionStatus } from "@/lib/session-utils";
import { ensureLeagueManager } from "@/lib/auth-utils";

/**
 * Jour de match — Option B : header sobre + focus session terrain.
 */
export default async function SessionDetailsPage({
  params,
}: {
  params: Promise<{ id: string; sessionId: string }>;
}) {
  const { id, sessionId } = await params;

  try {
    await ensureLeagueManager(id);
  } catch {
    notFound();
  }

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: {
      league: {
        include: {
          players: {
            orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
          },
          courts: true,
        },
      },
      attendances: true,
      matches: {
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
        include: {
          court: true,
        },
      },
    },
  });

  if (!session || session.leagueId !== id) {
    notFound();
  }

  const sessionWithMeta =
    session as unknown as import("@/lib/session-utils").SessionWithMeta;
  const status = getSessionStatus(sessionWithMeta);

  return (
    <div className="space-y-6 pb-24 lg:pb-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/5 pb-6">
        <div className="space-y-1">
          <p className="text-sm font-medium text-slate-400">
            {format(session.date, "EEEE d MMMM yyyy · HH'h'mm", { locale: fr })}
          </p>
          <h1 className="text-2xl md:text-3xl font-semibold text-white tracking-tight">
            Jour de match
          </h1>
          {session.location && (
            <p className="text-sm text-slate-500 flex items-center gap-1.5 pt-0.5">
              <MapPin className="w-3.5 h-3.5" />
              {session.location}
            </p>
          )}
        </div>

        <div
          className={`self-start sm:self-auto px-3 py-1.5 rounded-lg text-xs font-medium border ${status.color}`}
        >
          {status.label}
        </div>
      </div>

      <SessionDetailsClient
        session={{
          id: session.id,
          settings: session.settings as Record<string, unknown>,
        }}
        leaguePlayers={session.league.players.map((p) => ({
          ...p,
          type: p.type as "permanent" | "remplacant",
        }))}
        initialAttendances={session.attendances}
        courtCount={session.league.courts.length}
        statusLabel={status.label}
        initialMatches={(
          session.matches as unknown as Array<{
            id: string;
            courtId: string | null;
            court: { name: string } | null;
            data: import("@prisma/client").Prisma.JsonValue;
          }>
        ).map((m) => {
          const matchData = (m.data as {
            team1: string[];
            team2: string[];
            winner?: number;
          }) || { team1: [], team2: [] };
          return {
            id: m.id,
            courtId: m.courtId,
            court: m.court,
            data: matchData,
          };
        })}
      />
    </div>
  );
}
