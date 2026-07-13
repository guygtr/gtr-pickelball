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
  type MatchmakingStats,
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
  mode: "RANDOM" | "COMPETITIVE" = "RANDOM"
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
