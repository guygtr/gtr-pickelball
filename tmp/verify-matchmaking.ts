
import { generateFullSessionMatches, MatchmakingStats, getPartnershipKey } from '../src/lib/domain/matchmaking';
import { Player, Court } from '@prisma/client';

const players: Player[] = Array.from({ length: 8 }, (_, i) => ({
    id: `p${i + 1}`,
    firstName: `Player`,
    lastName: `${i + 1}`,
    email: null,
    phone: null,
    skillLevel: 3.0,
    isActive: true,
    leagueId: 'l1',
    createdAt: new Date(),
    updatedAt: new Date()
}));

const courts: Court[] = [
    { id: 'cA', name: 'Court A', note: null, playerCapacity: 4, leagueId: 'l1', createdAt: new Date(), updatedAt: new Date() },
    { id: 'cB', name: 'Court B', note: null, playerCapacity: 4, leagueId: 'l1', createdAt: new Date(), updatedAt: new Date() }
];

const stats: MatchmakingStats = {
    playCount: new Map(),
    partnershipCount: new Map(),
    oppositionCount: new Map(),
    matchupCount: new Map(),
    lastMatchups: new Set()
};

players.forEach(p => stats.playCount.set(p.id, 0));

console.log("Simulating 7 rounds for 8 players...");
const matches = generateFullSessionMatches(players, courts, stats, 105, 15); // 7 rounds

const partnerships = new Map<string, number>();

matches.forEach((m, i) => {
    const round = Math.floor(i / 2) + 1;
    // console.log(`Round ${round} - Court ${m.courtId}: ${m.team1.join(',')} vs ${m.team2.join(',')}`);
    
    const k1 = getPartnershipKey(m.team1[0], m.team1[1]);
    const k2 = getPartnershipKey(m.team2[0], m.team2[1]);
    
    partnerships.set(k1, (partnerships.get(k1) || 0) + 1);
    partnerships.set(k2, (partnerships.get(k2) || 0) + 1);
});

let duplicates = 0;
partnerships.forEach((count, key) => {
    if (count > 1) {
        console.log(`Duplicate partnership: ${key} occurred ${count} times`);
        duplicates++;
    }
});

if (duplicates === 0) {
    console.log("✅ SUCCESS: 0 duplicate partnerships in 7 rounds for 8 players!");
} else {
    console.log(`❌ FAILURE: ${duplicates} duplicate partnerships found.`);
    process.exit(1);
}

// Test 12 players
console.log("\nSimulating 11 rounds for 12 players...");
const players12: Player[] = Array.from({ length: 12 }, (_, i) => ({
    id: `p${i + 1}`,
    firstName: `Player`,
    lastName: `${i + 1}`,
    email: null,
    phone: null,
    skillLevel: 3.0,
    isActive: true,
    leagueId: 'l1',
    createdAt: new Date(),
    updatedAt: new Date()
}));
const courts12: Court[] = [
    { id: 'cA', name: 'Court A', note: null, playerCapacity: 4, leagueId: 'l1', createdAt: new Date(), updatedAt: new Date() },
    { id: 'cB', name: 'Court B', note: null, playerCapacity: 4, leagueId: 'l1', createdAt: new Date(), updatedAt: new Date() },
    { id: 'cC', name: 'Court C', note: null, playerCapacity: 4, leagueId: 'l1', createdAt: new Date(), updatedAt: new Date() }
];
const stats12: MatchmakingStats = {
    playCount: new Map(),
    partnershipCount: new Map(),
    oppositionCount: new Map(),
    matchupCount: new Map(),
    lastMatchups: new Set()
};
players12.forEach(p => stats12.playCount.set(p.id, 0));

const matches12 = generateFullSessionMatches(players12, courts12, stats12, 165, 15); // 11 rounds
const partnerships12 = new Map<string, number>();

matches12.forEach(m => {
    const k1 = getPartnershipKey(m.team1[0], m.team1[1]);
    const k2 = getPartnershipKey(m.team2[0], m.team2[1]);
    partnerships12.set(k1, (partnerships12.get(k1) || 0) + 1);
    partnerships12.set(k2, (partnerships12.get(k2) || 0) + 1);
});

let duplicates12 = 0;
partnerships12.forEach((count, key) => {
    if (count > 1) {
        duplicates12++;
    }
});

if (duplicates12 === 0) {
    console.log("✅ SUCCESS: 0 duplicate partnerships in 11 rounds for 12 players!");
} else {
    console.log(`❌ FAILURE: ${duplicates12} duplicate partnerships found.`);
}
