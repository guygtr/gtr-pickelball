import { describe, it, expect } from "vitest";
import {
  assertDevOnlyEnv,
  DEV_SUPABASE_REF,
  PROD_SUPABASE_REF,
} from "../helpers/dev-env";

describe("ENV dual-env Pickelball (I/S)", () => {
  it("ENV: .env.local pointe Dev, pas prod", () => {
    const { ref, supabaseUrl, databaseUrl } = assertDevOnlyEnv();
    expect(ref).toBe(DEV_SUPABASE_REF);
    expect(ref).not.toBe(PROD_SUPABASE_REF);
    expect(supabaseUrl).not.toContain(PROD_SUPABASE_REF);
    expect(databaseUrl).not.toContain(PROD_SUPABASE_REF);
  });
});
