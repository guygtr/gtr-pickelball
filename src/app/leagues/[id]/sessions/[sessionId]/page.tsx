import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar } from "lucide-react";
import { SessionDetailsClient } from "@/components/sessions/session-details-client";

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
          }
        }
      },
      attendances: true,
      matches: {
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
            <div className={`px-4 py-2 rounded-xl text-sm font-black tracking-widest ${
                session.status === 'DRAFT' ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30' :
                session.status === 'ACTIVE' ? 'bg-pickle-green/20 text-pickle-green border border-pickle-green/30' :
                'bg-slate-500/20 text-slate-400 border border-slate-500/30'
            }`}>
                {session.status}
            </div>
        </div>
      </div>

      <SessionDetailsClient 
        session={{ id: session.id }} 
        leaguePlayers={session.league.players}
        initialAttendances={session.attendances}
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
