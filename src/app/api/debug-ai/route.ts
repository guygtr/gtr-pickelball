import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // 1. Joueurs
    const players = await prisma.player.findMany({
      select: { firstName: true, lastName: true, skillLevel: true, aiLevel: true, aiMetadata: true }
    });

    // 2. Sessions COMPLETED + matchs
    const sessions = await prisma.session.findMany({
      where: { status: "COMPLETED" },
      include: { matches: true, attendances: { where: { isPresent: true } } }
    });

    const sessionsData = sessions.map(s => ({
      id: s.id,
      date: s.date,
      matchCount: s.matches.length,
      attendeeCount: s.attendances.length,
      matches: s.matches.map(m => {
        const d = m.data as any;
        return {
          id: m.id,
          status: d?.status,
          winner: d?.winner,
          team1: d?.team1,
          team2: d?.team2,
        };
      })
    }));

    return NextResponse.json({
      players: players.map(p => ({
        name: `${p.firstName} ${p.lastName}`,
        skillLevel: p.skillLevel,
        aiLevel: p.aiLevel,
        aiMetadata: p.aiMetadata,
      })),
      sessions: sessionsData,
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
