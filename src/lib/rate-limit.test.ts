import { describe, it, expect } from "vitest";
import { checkRateLimit } from "./rate-limit";

describe("rate-limit (U)", () => {
  it("autorise jusqu'à la limite puis bloque", () => {
    const key = `pb-test:${Date.now()}:${Math.random()}`;
    expect(checkRateLimit(key, 2, 60_000).allowed).toBe(true);
    expect(checkRateLimit(key, 2, 60_000).allowed).toBe(true);
    const blocked = checkRateLimit(key, 2, 60_000);
    expect(blocked.allowed).toBe(false);
    if (!blocked.allowed) {
      expect(blocked.retryAfterSec).toBeGreaterThan(0);
    }
  });
});
