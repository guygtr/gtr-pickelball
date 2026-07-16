/**
 * Multi-tenant pb_* — isolation manager / cascade (GTR-Database-Dev).
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  assertDevOnlyEnv,
  createTestPrisma,
  NFR_PREFIX,
} from "../helpers/dev-env";

const MGR_A = "nfr-test-mgr-a-00000000-0000-4000-8000-0000000000a1";
const MGR_B = "nfr-test-mgr-b-00000000-0000-4000-8000-0000000000b2";

describe("Leagues / players integration Dev (I)", () => {
  const prisma = createTestPrisma();
  const leagueIds: string[] = [];

  beforeAll(() => assertDevOnlyEnv());

  afterAll(async () => {
    // Cascade: delete leagues NFR (players/courts/sessions follow FK)
    await prisma.league.deleteMany({
      where: {
        OR: [
          { name: { startsWith: NFR_PREFIX } },
          { id: { in: leagueIds } },
        ],
      },
    });
    await prisma.$disconnect();
  });

  it("connecte schema pb", async () => {
    const n = await prisma.league.count();
    expect(n).toBeGreaterThanOrEqual(0);
  });

  it("crée ligue + joueurs, isole par managerId", async () => {
    const leagueA = await prisma.league.create({
      data: {
        name: `${NFR_PREFIX}League-A`,
        managerId: MGR_A,
        description: "nfr",
      },
    });
    leagueIds.push(leagueA.id);

    const leagueB = await prisma.league.create({
      data: {
        name: `${NFR_PREFIX}League-B`,
        managerId: MGR_B,
        description: "nfr",
      },
    });
    leagueIds.push(leagueB.id);

    await prisma.player.create({
      data: {
        firstName: "NFR",
        lastName: "Alice",
        skillLevel: 3.0,
        leagueId: leagueA.id,
      },
    });
    await prisma.player.create({
      data: {
        firstName: "NFR",
        lastName: "Bob",
        skillLevel: 2.5,
        leagueId: leagueB.id,
      },
    });

    const listA = await prisma.league.findMany({
      where: { managerId: MGR_A, name: { startsWith: NFR_PREFIX } },
      include: { players: true },
    });
    expect(listA).toHaveLength(1);
    expect(listA[0]!.players).toHaveLength(1);
    expect(listA[0]!.players[0]!.lastName).toBe("Alice");

    // IDOR sim: B ne voit pas A
    const cross = await prisma.league.findMany({
      where: { id: leagueA.id, managerId: MGR_B },
    });
    expect(cross).toHaveLength(0);
  });

  it("cascade delete ligue → joueurs", async () => {
    const league = await prisma.league.create({
      data: {
        name: `${NFR_PREFIX}Cascade`,
        managerId: MGR_A,
      },
    });
    leagueIds.push(league.id);
    const p = await prisma.player.create({
      data: {
        firstName: "NFR",
        lastName: "Cascade",
        skillLevel: 3,
        leagueId: league.id,
      },
    });

    await prisma.league.delete({ where: { id: league.id } });
    leagueIds.pop();
    const gone = await prisma.player.findUnique({ where: { id: p.id } });
    expect(gone).toBeNull();
  });

  it("courts liés à la ligue", async () => {
    const league = await prisma.league.create({
      data: { name: `${NFR_PREFIX}Courts`, managerId: MGR_A },
    });
    leagueIds.push(league.id);
    const court = await prisma.court.create({
      data: {
        name: `${NFR_PREFIX}T1`,
        playerCapacity: 4,
        leagueId: league.id,
      },
    });
    const found = await prisma.court.findMany({
      where: { leagueId: league.id },
    });
    expect(found.some((c) => c.id === court.id)).toBe(true);
  });
});
