/**
 * Managers table + co-managers structure (Dev).
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  assertDevOnlyEnv,
  createTestPrisma,
  NFR_PREFIX,
} from "../helpers/dev-env";

const MGR_ID = "nfr-test-mgr-x-00000000-0000-4000-8000-0000000000x1";

describe("Managers integration Dev (I)", () => {
  const prisma = createTestPrisma();

  beforeAll(() => assertDevOnlyEnv());

  afterAll(async () => {
    await prisma.coManager.deleteMany({
      where: { managerId: MGR_ID },
    });
    await prisma.league.deleteMany({
      where: { name: { startsWith: NFR_PREFIX }, managerId: MGR_ID },
    });
    await prisma.manager.deleteMany({
      where: { id: MGR_ID },
    });
    await prisma.$disconnect();
  });

  it("upsert manager NFR", async () => {
    const m = await prisma.manager.upsert({
      where: { id: MGR_ID },
      create: {
        id: MGR_ID,
        email: `nfr-test-mgr@example.com`,
        name: `${NFR_PREFIX}Manager`,
        role: "manager",
      },
      update: { name: `${NFR_PREFIX}Manager` },
    });
    expect(m.email).toContain("nfr-test");
  });

  it("compte managers Dev >= 1 (seed)", async () => {
    const n = await prisma.manager.count();
    expect(n).toBeGreaterThanOrEqual(1);
  });
});
