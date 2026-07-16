import { describe, it, expect } from "vitest";
import { GROK_MODEL, GROK_BASE_URL } from "./grok";

describe("grok config (U)", () => {
  it("modèle flotte par défaut grok-4.5", () => {
    expect(GROK_MODEL).toBe(process.env.GROK_MODEL?.trim() || "grok-4.5");
    expect(GROK_BASE_URL).toContain("api.x.ai");
  });
});
