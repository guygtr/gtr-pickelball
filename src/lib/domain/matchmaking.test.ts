/**
 * Tests domaine matchmaking — fiabilité du moteur (soirée type / scores).
 */
import { describe, it, expect } from "vitest";
import type { Player, Court } from "@prisma/client";
import {
  getPartnershipKey,
  getQuartetKey,
  getMatchupKey,
  generateOptimalRound,
  generateFullSessionMatches,
  getModeWeights,
  type MatchmakingStats,
  type MatchmakingMode,
} from "./matchmaking";

function mockPlayer(id: string, skill = 3): Player {
  return {
    id,
    firstName: id,
    lastName: "T",
    email: null,
    phone: null,
    skillLevel: skill,
    aiLevel: skill,
    aiMetadata: null,
    type: "permanent",
    isActive: true,
    leagueId: "league1",
    createdAt: new Date(),
    updatedAt: new Date(),
  } as Player;
}

function mockCourt(id: string): Court {
  return {
    id,
    name: id,
    note: null,
    playerCapacity: 4,
    leagueId: "league1",
    createdAt: new Date(),
    updatedAt: new Date(),
  } as Court;
}

function emptyStats(
  playerIds: string[],
  skills: number[],
  mode: MatchmakingMode = "RANDOM"
): MatchmakingStats {
  return {
    playCount: new Map(playerIds.map((id) => [id, 0])),
    partnershipCount: new Map(),
    oppositionCount: new Map(),
    matchupCount: new Map(),
    quartetCount: new Map(),
    lastMatchups: new Set(),
    lastOppositions: new Set(),
    playerSkills: new Map(playerIds.map((id, i) => [id, skills[i] ?? 3])),
    mode,
  };
}

describe("matchmaking keys", () => {
  it("getPartnershipKey is commutative", () => {
    expect(getPartnershipKey("a", "b")).toBe(getPartnershipKey("b", "a"));
  });

  it("getQuartetKey sorts ids", () => {
    expect(getQuartetKey(["d", "a", "c", "b"])).toBe("a,b,c,d");
  });

  it("getMatchupKey is stable for swapped teams", () => {
    const k1 = getMatchupKey(["a", "b"], ["c", "d"]);
    const k2 = getMatchupKey(["c", "d"], ["a", "b"]);
    expect(k1).toBe(k2);
  });
});

describe("mode weights", () => {
  it("TOURNAMENT uses skill and high social variety", () => {
    const t = getModeWeights("TOURNAMENT");
    const r = getModeWeights("RANDOM");
    const c = getModeWeights("COMPETITIVE");
    expect(t.useSkill).toBe(true);
    expect(t.SKILL_BALANCE_WEIGHT).toBeGreaterThan(0);
    expect(t.PARTNER_WEIGHT).toBeGreaterThan(c.PARTNER_WEIGHT);
    expect(t.PARTNER_WEIGHT).toBeLessThanOrEqual(r.PARTNER_WEIGHT * 1.1);
  });
});

describe("generateOptimalRound", () => {
  it("produces doubles matches for 4 players and 1 court", () => {
    const players = ["p1", "p2", "p3", "p4"].map((id) => mockPlayer(id));
    const courts = [mockCourt("c1")];
    const stats = emptyStats(
      players.map((p) => p.id),
      [3, 3, 3, 3],
      "RANDOM"
    );

    const { matches, cost } = generateOptimalRound(players, courts, stats, 200);

    expect(matches.length).toBe(1);
    expect(matches[0].type).toBe("DOUBLES");
    expect(matches[0].team1.length).toBe(2);
    expect(matches[0].team2.length).toBe(2);
    expect(matches[0].courtId).toBe("c1");
    const all = [...matches[0].team1, ...matches[0].team2];
    expect(new Set(all).size).toBe(4);
    expect(Number.isFinite(cost)).toBe(true);
  });

  it("produces one match per court when possible", () => {
    const players = ["a", "b", "c", "d", "e", "f", "g", "h"].map((id) =>
      mockPlayer(id)
    );
    const courts = [mockCourt("c1"), mockCourt("c2")];
    const stats = emptyStats(
      players.map((p) => p.id),
      players.map(() => 3),
      "COMPETITIVE"
    );

    const { matches } = generateOptimalRound(players, courts, stats, 300);

    expect(matches.length).toBe(2);
    const used = new Set(matches.flatMap((m) => [...m.team1, ...m.team2]));
    expect(used.size).toBe(8);
  });

  it("handles singles when only 2 players", () => {
    const players = [mockPlayer("x"), mockPlayer("y")];
    const courts = [mockCourt("c1")];
    const stats = emptyStats(["x", "y"], [3.5, 3.0], "COMPETITIVE");

    const { matches } = generateOptimalRound(players, courts, stats, 100);

    expect(matches.length).toBe(1);
    expect(matches[0].type).toBe("SINGLES");
    expect(matches[0].team1).toHaveLength(1);
    expect(matches[0].team2).toHaveLength(1);
  });
});

describe("bench equity — 10 players / 2 courts", () => {
  /**
   * 2 terrains × 4 = 8 places ; 10 présents → 2 au banc par ronde.
   * Sur N rondes : max(playCount) − min(playCount) ≤ 1.
   */
  it("10 joueurs / 2 courts → max(playCount)−min(playCount) ≤ 1 sur N rondes", () => {
    const nRounds = 5;
    const matchDuration = 15;
    const sessionDuration = nRounds * matchDuration; // 5 rondes

    const players = Array.from({ length: 10 }, (_, i) =>
      mockPlayer(`p${i}`, 2.0 + (i % 5) * 0.5)
    );
    const courts = [mockCourt("c1"), mockCourt("c2")];
    const stats = emptyStats(
      players.map((p) => p.id),
      players.map((p) => p.skillLevel),
      "TOURNAMENT"
    );

    const designs = generateFullSessionMatches(
      players,
      courts,
      stats,
      sessionDuration,
      matchDuration,
      400
    );

    // Chaque ronde = 2 matchs doubles → 8 joueurs
    expect(designs.length).toBeGreaterThanOrEqual(nRounds * 2);

    const playCount = new Map<string, number>(
      players.map((p) => [p.id, 0])
    );
    for (const m of designs) {
      for (const id of [...m.team1, ...m.team2]) {
        playCount.set(id, (playCount.get(id) || 0) + 1);
      }
    }

    // Tous les présents doivent avoir joué au moins une fois sur plusieurs rondes
    expect(playCount.size).toBe(10);
    for (const p of players) {
      expect(playCount.get(p.id)).toBeGreaterThan(0);
    }

    const values = [...playCount.values()];
    const maxP = Math.max(...values);
    const minP = Math.min(...values);
    expect(maxP - minP).toBeLessThanOrEqual(1);
  });

  it("same equity holds for COMPETITIVE and RANDOM modes", () => {
    const nRounds = 5;
    const sessionDuration = nRounds * 15;
    const players = Array.from({ length: 10 }, (_, i) =>
      mockPlayer(`q${i}`, 3)
    );
    const courts = [mockCourt("c1"), mockCourt("c2")];

    for (const mode of ["RANDOM", "COMPETITIVE"] as const) {
      const stats = emptyStats(
        players.map((p) => p.id),
        players.map(() => 3),
        mode
      );
      const designs = generateFullSessionMatches(
        players,
        courts,
        stats,
        sessionDuration,
        15,
        300
      );
      const playCount = new Map(players.map((p) => [p.id, 0]));
      for (const m of designs) {
        for (const id of [...m.team1, ...m.team2]) {
          playCount.set(id, (playCount.get(id) || 0) + 1);
        }
      }
      const values = [...playCount.values()];
      expect(Math.max(...values) - Math.min(...values)).toBeLessThanOrEqual(1);
    }
  });
});
