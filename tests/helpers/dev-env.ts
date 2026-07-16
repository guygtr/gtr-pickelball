/**
 * Garde-fous dual-env — tests d'intégration Pickelball (GTR-Database-Dev only).
 */
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

export const PROD_SUPABASE_REF = "ncsxtgdnwjxoprtccggk";
export const DEV_SUPABASE_REF = "gekqmisuvhxfwdhtjefl";
export const NFR_PREFIX = "NFR-TEST-";

export function getSupabaseRefFromUrl(url: string | undefined): string | null {
  if (!url) return null;
  const m = url.match(/https:\/\/([a-z0-9]+)\.supabase\.co/i);
  return m?.[1] ?? null;
}

export function assertDevOnlyEnv(): {
  databaseUrl: string;
  supabaseUrl: string;
  ref: string;
} {
  const databaseUrl = process.env.DATABASE_URL?.trim() || "";
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
    process.env.SUPABASE_URL?.trim() ||
    "";

  if (!databaseUrl) {
    throw new Error("DATABASE_URL manquante — write-env-local-dev.cjs");
  }
  if (!supabaseUrl) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL manquante");
  }

  const ref = getSupabaseRefFromUrl(supabaseUrl);
  if (!ref) throw new Error(`URL Supabase invalide: ${supabaseUrl}`);
  if (ref === PROD_SUPABASE_REF || databaseUrl.includes(PROD_SUPABASE_REF)) {
    throw new Error(
      `REFUS: tests pointent vers GTR-Database PROD (${PROD_SUPABASE_REF})`
    );
  }
  if (
    process.env.ALLOW_NON_DEV_TEST !== "1" &&
    ref !== DEV_SUPABASE_REF &&
    !databaseUrl.includes(DEV_SUPABASE_REF)
  ) {
    throw new Error(
      `REFUS: ref ${ref} n'est pas GTR-Database-Dev (${DEV_SUPABASE_REF})`
    );
  }

  return { databaseUrl, supabaseUrl, ref };
}

export function createTestPrisma(): PrismaClient {
  const { databaseUrl } = assertDevOnlyEnv();
  const pool = new Pool({ connectionString: databaseUrl });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({
    adapter,
    log: ["error"],
  });
}
