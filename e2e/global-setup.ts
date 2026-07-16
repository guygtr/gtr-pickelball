/**
 * Prépare compte Auth E2E sur GTR-Database-Dev (jamais prod).
 */
import path from "path";
import { config as loadEnv } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { Client } from "pg";

loadEnv({ path: path.resolve(process.cwd(), ".env.local") });
loadEnv({ path: path.resolve(process.cwd(), ".env") });

const PROD_REF = "ncsxtgdnwjxoprtccggk";
const DEV_REF = "gekqmisuvhxfwdhtjefl";

export const E2E_DEFAULTS = {
  adminEmail:
    process.env.E2E_ADMIN_EMAIL ||
    process.env.ADMIN_EMAILS?.split(",")[0]?.trim() ||
    "guy.gtr@gmail.com",
  // Shared Dev Auth with Bar — same default so E2E flotte reste cohérent
  adminPassword: process.env.E2E_ADMIN_PASSWORD || "E2E-Admin-GTR-Dev-2026!",
};

function assertDev(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const m = url.match(/https:\/\/([a-z0-9]+)\.supabase\.co/i);
  const ref = m?.[1] || "";
  if (!ref) throw new Error("NEXT_PUBLIC_SUPABASE_URL manquante");
  if (ref === PROD_REF) throw new Error("E2E REFUSÉ: pointe PROD");
  if (ref !== DEV_REF && process.env.ALLOW_NON_DEV_TEST !== "1") {
    throw new Error(`E2E REFUSÉ: ref ${ref} ≠ Dev`);
  }
  return url;
}

export default async function globalSetup() {
  const url = assertDev();
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!service) throw new Error("SUPABASE_SERVICE_ROLE_KEY requis pour E2E");

  const admin = createClient(url, service, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const email = E2E_DEFAULTS.adminEmail.toLowerCase();
  const password = E2E_DEFAULTS.adminPassword;

  const { data: listed, error: listErr } = await admin.auth.admin.listUsers({
    perPage: 200,
  });
  if (listErr) throw listErr;

  const existing = listed.users.find(
    (u) => (u.email || "").toLowerCase() === email
  );

  let userId: string;
  if (existing) {
    const { error } = await admin.auth.admin.updateUserById(existing.id, {
      password,
      email_confirm: true,
    });
    if (error) throw error;
    userId = existing.id;
    console.log("[e2e-setup] password reset:", email);
  } else {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name: "E2E Admin", role: "manager" },
    });
    if (error) throw error;
    userId = data.user!.id;
    console.log("[e2e-setup] user created:", email);
  }

  const dbUrl =
    process.env.DIRECT_URL || process.env.DATABASE_URL;
  if (dbUrl) {
    const c = new Client({
      connectionString: dbUrl,
      ssl: { rejectUnauthorized: false },
    });
    await c.connect();
    // Align manager row (id = auth user id)
    const byEmail = await c.query(
      `SELECT id FROM pb.pb_managers WHERE lower(email) = lower($1)`,
      [email]
    );
    if (byEmail.rows.length) {
      await c.query(
        `UPDATE pb.pb_managers SET id = $1, name = COALESCE(name, $2), "updatedAt" = NOW() WHERE lower(email) = lower($3)`,
        [userId, "E2E Admin", email]
      );
    } else {
      await c.query(
        `INSERT INTO pb.pb_managers (id, email, name, role, "createdAt", "updatedAt")
         VALUES ($1, $2, $3, 'admin', NOW(), NOW())
         ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, "updatedAt" = NOW()`,
        [userId, email, "E2E Admin"]
      );
    }
    await c.end();
    console.log("[e2e-setup] pb_managers aligned");
  }

  process.env.E2E_ADMIN_EMAIL = email;
  process.env.E2E_ADMIN_PASSWORD = password;
  console.log("[e2e-setup] Dev ready for Pickelball E2E");
}
