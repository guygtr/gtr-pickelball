
import { generateFullSessionMatches, MatchmakingStats, getPartnershipKey } from '../src/lib/domain/matchmaking';
import { Player, Court } from '@prisma/client';

const players: Player[] = [
    // 4 Forts
    { id: 'p1', firstName: 'Strong', lastName: 'A', skillLevel: 4.5, isActive: true, leagueId: 'l1' } as any,
    { id: 'p2', firstName: 'Strong', lastName: 'B', skillLevel: 4.5, isActive: true, leagueId: 'l1' } as any,
    { id: 'p3', firstName: 'Strong', lastName: 'C', skillLevel: 4.5, isActive: true, leagueId: 'l1' } as any,
    { id: 'p4', firstName: 'Strong', lastName: 'D', skillLevel: 4.5, isActive: true, leagueId: 'l1' } as any,
    // 4 Faibles
    { id: 'p5', firstName: 'Weak', lastName: 'E', skillLevel: 2.0, isActive: true, leagueId: 'l1' } as any,
    { id: 'p6', firstName: 'Weak', lastName: 'F', skillLevel: 2.0, isActive: true, leagueId: 'l1' } as any,
    { id: 'p7', firstName: 'Weak', lastName: 'G', skillLevel: 2.0, isActive: true, leagueId: 'l1' } as any,
    { id: 'p8', firstName: 'Weak', lastName: 'H', skillLevel: 2.0, isActive: true, leagueId: 'l1' } as any,
];

const courts: Court[] = [
    { id: 'cA', name: 'Court A' } as any,
    { id: 'cB', name: 'Court B' } as any
];

const stats: MatchmakingStats = {
    playCount: new Map(),
    partnershipCount: new Map(),
    oppositionCount: new Map(),
    matchupCount: new Map(),
    lastMatchups: new Set(),
    playerSkills: new Map(players.map(p => [p.id, p.skillLevel])),
    mode: 'COMPETITIVE'
};

players.forEach(p => stats.playCount.set(p.id, 0));

console.log("=== SIMULATION MODE COMPÉTITION (4 Forts vs 4 Faibles) ===");
const matches = generateFullSessionMatches(players, courts, stats, 30, 15); // 2 rounds

matches.forEach((m, i) => {
    const round = Math.floor(i / 2) + 1;
    const p1 = players.find(p => p.id === m.team1[0]);
    const p2 = players.find(p => p.id === m.team1[1]);
    const p3 = players.find(p => p.id === m.team2[0]);
    const p4 = players.find(p => p.id === m.team2[1]);
    
    console.log(`Ronde ${round} - Terrain ${m.courtId}:`);
    console.log(`  Équipe 1: ${p1?.firstName} (${p1?.skillLevel}) & ${p2?.firstName} (${p2?.skillLevel})`);
    console.log(`  Équipe 2: ${p3?.firstName} (${p3?.skillLevel}) & ${p4?.firstName} (${p4?.skillLevel})`);
    
    const avgT1 = ((p1?.skillLevel ?? 0) + (p2?.skillLevel ?? 0)) / 2;
    const avgT2 = ((p3?.skillLevel ?? 0) + (p4?.skillLevel ?? 0)) / 2;
    console.log(`  Équilibre: Équipe1(avg ${avgT1}) vs Équipe2(avg ${avgT2}) | Écart: ${Math.abs(avgT1 - avgT2)}`);
    console.log("------------------------------------------");
});

// Vérification de l'homogénéité
let mixedMatches = 0;
matches.forEach(m => {
    const skills = [...m.team1, ...m.team2].map(id => players.find(p => p.id === id)?.skillLevel ?? 0);
    const hasStrong = skills.some(s => s >= 4.0);
    const hasWeak = skills.some(s => s <= 2.5);
    if (hasStrong && hasWeak) mixedMatches++;
});

if (mixedMatches === 0) {
    console.log("✅ SUCCÈS : Les forts jouent avec les forts, les faibles avec les faibles !");
} else {
    console.log(`ℹ️ NOTE : ${mixedMatches} matchs mixtes générés (arbitrage entre skill et rotation).`);
}
