/**
 * Applique RLS multi-tenant Pickelball (schema pb) via pg Pool.
 * Usage: node scripts/apply-rls-p1.mjs
 */
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const require = createRequire(import.meta.url);

function loadEnv(path) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i < 0) continue;
    const k = t.slice(0, i).trim();
    let v = t.slice(i + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[k]) process.env[k] = v;
  }
}

loadEnv(resolve(root, ".env.local"));
loadEnv(resolve(root, ".env"));

const url = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL / DIRECT_URL manquant");
  process.exit(1);
}

const { Pool } = require("pg");
const pool = new Pool({ connectionString: url });

const sqlPath = resolve(
  root,
  "supabase/migrations/20260713_rls_league_manager.sql"
);
const sql = readFileSync(sqlPath, "utf8");

async function main() {
  console.log("**[STARLINK] →** Application RLS Pickelball (schema pb)...");
  const client = await pool.connect();
  try {
    await client.query(sql);
    console.log("**[STARLINK] →** Migration SQL exécutée.");

    const { rows } = await client.query(`
      SELECT tablename, policyname
      FROM pg_policies
      WHERE schemaname = 'pb'
      ORDER BY tablename, policyname
    `);
    console.log(`Politiques pb: ${rows.length}`);
    for (const p of rows) {
      console.log(`  - ${p.tablename}.${p.policyname}`);
    }
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
