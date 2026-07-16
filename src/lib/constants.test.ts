import { describe, it, expect } from "vitest";
import { getNearestSkillLevel, SKILL_LEVELS, DEFAULT_SKILL_LEVEL } from "./constants";

describe("skill levels (U)", () => {
  it("DEFAULT_SKILL_LEVEL dans la grille", () => {
    expect(SKILL_LEVELS).toContain(DEFAULT_SKILL_LEVEL);
  });

  it("getNearestSkillLevel arrondit au cran le plus proche", () => {
    expect(getNearestSkillLevel(2.4)).toBe(2.3);
    expect(getNearestSkillLevel(2.45)).toBe(2.5);
    expect(getNearestSkillLevel(5.9)).toBe(5.0);
  });
});
