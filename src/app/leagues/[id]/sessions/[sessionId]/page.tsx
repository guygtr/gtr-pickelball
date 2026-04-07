import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar } from "lucide-react";
import { SessionDetailsClient } from "@/components/sessions/session-details-client";
import { getSessionStatus } from "@/lib/session-utils";

export default async function SessionDetailsPage({
  params,
}: {
  params: Promise<{ id: string; sessionId: string }>;
}) {
  const { id, sessionId } = await params;

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
          <div className="flex items-center gap-2 text-pickle-blue font-bold mb-2">
            <Calendar className="w-5 h-5" />
            <span>SESSION DU {format(session.date, "d MMMM yyyy", { locale: fr }).toUpperCase()}</span>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight">
            Détails de la Session
          </h1>
        </div>
        
        <div className="flex items-center gap-3 bg-white/5 p-2 rounded-2xl border border-white/10">
          {(() => {
            const statusLabel = getSessionStatus(session).label;
            const statusColor = getSessionStatus(session).color;
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
        leaguePlayers={session.league.players}
        initialAttendances={session.attendances}
        courtCount={session.league.courts.length}
        statusLabel={getSessionStatus(session).label}
        initialMatches={(session.matches as unknown as Array<{ 
          id: string; 
          courtId: string | null; 
          court: { name: string } | null; 
          player1Id: string; 
          player2Id: string; 
          player3Id: string; 
          player4Id: string; 
          score1: number; 
          score2: number; 
          data: unknown;
        }>).map((m) => ({
          id: m.id,
          courtId: m.courtId,
          court: m.court,
          data: (m.data as { team1: string[]; team2: string[] }) || {
            team1: [m.player1Id, m.player2Id],
            team2: [m.player3Id, m.player4Id]
          }
        }))}
      />
    </div>
  );
}
