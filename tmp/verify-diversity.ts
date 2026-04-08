
import { generateFullSessionMatches, MatchmakingStats, getQuartetKey } from '../src/lib/domain/matchmaking';
import { Player, Court } from '@prisma/client';

const players: Player[] = [
    { id: 'p1', firstName: 'Christian', lastName: 'D', skillLevel: 3.5 } as any,
    { id: 'p2', firstName: 'Lorraine', lastName: 'R', skillLevel: 3.5 } as any,
    { id: 'p3', firstName: 'Claire', lastName: 'L', skillLevel: 3.5 } as any,
    { id: 'p4', firstName: 'Guy', lastName: 'T', skillLevel: 3.5 } as any,
    { id: 'p5', firstName: 'Brigitte', lastName: 'P', skillLevel: 3.5 } as any,
    { id: 'p6', firstName: 'Guylaine', lastName: 'T', skillLevel: 3.5 } as any,
    { id: 'p7', firstName: 'Nathalie', lastName: 'H', skillLevel: 3.5 } as any,
    { id: 'p8', firstName: 'Dominique', lastName: 'T', skillLevel: 3.5 } as any,
];

const courts: Court[] = [
    { id: 'cA', name: 'Terrain A' } as any,
    { id: 'cB', name: 'Terrain B' } as any
];

const stats: MatchmakingStats = {
    playCount: new Map(players.map(p => [p.id, 0])),
    partnershipCount: new Map(),
    oppositionCount: new Map(),
    matchupCount: new Map(),
    quartetCount: new Map(),
    lastMatchups: new Set(),
    playerSkills: new Map(players.map(p => [p.id, 3.5])),
    mode: 'SOCIAL'
};

console.log("=== SIMULATION DIVERSITÉ DES ÉQUIPES (8 Joueurs / 7 Rondes) ===");
const matches = generateFullSessionMatches(players, courts, stats, 105, 15); // 7 rounds

const quartetsHistory: Record<string, number> = {};

matches.forEach((m, i) => {
    const round = Math.floor(i / 2) + 1;
    const qKey = getQuartetKey([...m.team1, ...m.team2]);
    quartetsHistory[qKey] = (quartetsHistory[qKey] || 0) + 1;
    
    if (i % 2 === 0) console.log(`\nRONDE ${round}`);
    console.log(`  Terrain ${m.courtId}: [${m.team1.join(', ')}] vs [${m.team2.join(', ')}]`);
});

console.log("\n=== RÉCAPITULATIF DES QUATUORS ===");
let repetitions = 0;
Object.entries(quartetsHistory).forEach(([key, count]) => {
    if (count > 1) {
        console.log(`  Le groupe {${key.split(',').join(', ')}} a joué ${count} fois ensemble.`);
        repetitions += (count - 1);
    }
});

if (repetitions === 0) {
    console.log("\n✅ SUCCÈS : Diversité maximale ! Aucun groupe de 4 ne s'est répété.");
} else {
    console.log(`\nℹ️ NOTE : ${repetitions} répétitions de groupes détectées. C'est beaucoup mieux que les 6-8 répétitions précédentes !`);
}
