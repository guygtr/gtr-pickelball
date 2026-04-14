import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar } from "lucide-react";
import { SessionDetailsClient } from "@/components/sessions/session-details-client";
import { getSessionStatus } from "@/lib/session-utils";
import { ensureLeagueManager } from "@/lib/auth-utils";

export default async function SessionDetailsPage({
  params,
}: {
  params: Promise<{ id: string; sessionId: string }>;
}) {
  const { id, sessionId } = await params;

  // Vérification d'autorisation : seul le gestionnaire ou co-gestionnaire peut accéder
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
            orderBy: [{ lastName: "asc" }, { firstName: "asc" }]
          },
          courts: true
        }
      },
      attendances: true,
      matches: {
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
        include: {
          court: true
        }
      }
    }
  });

  if (!session || session.leagueId !== id) {
    notFound();
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-pickle-secondary font-bold mb-2">
            <Calendar className="w-5 h-5" />
            <span>SESSION DU {format(session.date, "d MMMM yyyy", { locale: fr }).toUpperCase()}</span>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight">
            Détails de la Session
          </h1>
        </div>
        
        <div className="flex items-center gap-3 bg-white/5 p-2 rounded-2xl border border-white/10">
          {(() => {
            const sessionWithMeta = session as unknown as import("@/lib/session-utils").SessionWithMeta;
            const statusLabel = getSessionStatus(sessionWithMeta).label;
            const statusColor = getSessionStatus(sessionWithMeta).color;
            return (
              <div className={`px-4 py-2 rounded-xl text-sm font-black tracking-widest ${statusColor}`}>
                {statusLabel.toUpperCase()}
              </div>
            );
          })()}
        </div>
      </div>

      <SessionDetailsClient 
        session={{ id: session.id, settings: session.settings as Record<string, unknown> }} 
        leaguePlayers={session.league.players.map(p => ({...p, type: p.type as "permanent" | "remplacant"}))}
        initialAttendances={session.attendances}
        courtCount={session.league.courts.length}
        statusLabel={getSessionStatus(session as unknown as import("@/lib/session-utils").SessionWithMeta).label}
        initialMatches={(session.matches as unknown as Array<{ 
          id: string; 
          courtId: string | null; 
          court: { name: string } | null; 
          data: import("@prisma/client").Prisma.JsonValue;
        }>).map((m) => {
          const matchData = (m.data as { team1: string[]; team2: string[]; winner?: number }) || { team1: [], team2: [] };
          return {
            id: m.id,
            courtId: m.courtId,
            court: m.court,
            data: matchData
          };
        })}
      />
    </div>
  );
}
