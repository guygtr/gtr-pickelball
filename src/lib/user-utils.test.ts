import { describe, it, expect, afterEach } from "vitest";
import { isUserAdmin } from "./user-utils";

describe("isUserAdmin (U)", () => {
  const prev = process.env.ADMIN_EMAILS;

  afterEach(() => {
    if (prev === undefined) delete process.env.ADMIN_EMAILS;
    else process.env.ADMIN_EMAILS = prev;
  });

  it("fail-closed sans ADMIN_EMAILS", () => {
    delete process.env.ADMIN_EMAILS;
    expect(isUserAdmin("guy.gtr@gmail.com")).toBe(false);
  });

  it("match case-insensitive multi-emails", () => {
    process.env.ADMIN_EMAILS = "guy.gtr@gmail.com, other@x.com";
    expect(isUserAdmin("Guy.Gtr@Gmail.com")).toBe(true);
    expect(isUserAdmin("other@x.com")).toBe(true);
    expect(isUserAdmin("stranger@x.com")).toBe(false);
    expect(isUserAdmin(null)).toBe(false);
  });
});
