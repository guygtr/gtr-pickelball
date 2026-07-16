import { describe, it, expect } from "vitest";
import { calculateGtrElo, computeSessionImpact } from "./elo";

describe("GTR Smart-ELO (U)", () => {
  it("victoire surprise monte le niveau", () => {
    const r = calculateGtrElo(3.0, 3.0, 2.5, 4.0, true, 0);
    expect(r.newAiLevel).toBeGreaterThan(3.0);
    expect(r.expectedOutcome).toBeLessThan(0.5);
  });

  it("défaite attendue baisse peu le niveau", () => {
    const r = calculateGtrElo(3.0, 3.0, 2.0, 4.5, false, 25);
    expect(r.newAiLevel).toBeLessThanOrEqual(3.0);
    expect(r.newAiLevel).toBeGreaterThanOrEqual(1.0);
  });

  it("clamp entre 1.0 et 5.5", () => {
    const high = calculateGtrElo(5.4, 5.0, 5.0, 1.0, true, 0);
    expect(high.newAiLevel).toBeLessThanOrEqual(5.5);
    const low = calculateGtrElo(1.1, 1.0, 1.0, 5.0, false, 0);
    expect(low.newAiLevel).toBeGreaterThanOrEqual(1.0);
  });

  it("computeSessionImpact agrège plusieurs matchs", () => {
    const level = computeSessionImpact(3.0, 3.0, [
      { won: true, opponentAvg: 3.0, teamAvg: 3.0 },
      { won: false, opponentAvg: 3.5, teamAvg: 3.0 },
    ]);
    expect(level).toBeGreaterThanOrEqual(1.0);
    expect(level).toBeLessThanOrEqual(5.5);
  });
});
