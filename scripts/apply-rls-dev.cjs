/**
 * Apply pb RLS migration to GTR-Database-Dev (same SQL as prod).
 */
const { Client } = require("pg");
const fs = require("fs");
const path = require("path");

function loadTokens() {
  const t = {};
  for (const line of fs.readFileSync("D:/GrokBuild/.tokens/gtr-tokens.env", "utf8").split(/\r?\n/)) {
    const s = line.trim();
    if (!s || s.startsWith("#")) continue;
    const i = s.indexOf("=");
    if (i < 1) continue;
    t[s.slice(0, i).trim()] = s.slice(i + 1).trim().replace(/^["']|["']$/g, "");
  }
  return t;
}

(async () => {
  const t = loadTokens();
  const url = t.GTR_DB_DEV_DIRECT_URL || t.GTR_DB_DEV_DATABASE_URL;
  const sqlPath = path.join(
    __dirname,
    "..",
    "supabase",
    "migrations",
    "20260713_rls_league_manager.sql"
  );
  const sql = fs.readFileSync(sqlPath, "utf8");

  const c = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  await c.connect();
  console.log("Applying RLS migration to GTR-Database-Dev…");
  console.log("  file:", sqlPath);

  // Ensure schema privileges for Supabase roles (PostgREST)
  await c.query(`GRANT USAGE ON SCHEMA pb TO anon, authenticated, service_role`);
  await c.query(
    `GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA pb TO authenticated`
  );
  await c.query(`GRANT ALL ON ALL TABLES IN SCHEMA pb TO service_role`);
  // anon: no table access by default for pb (RLS would deny anyway without policies for anon)
  await c.query(`REVOKE ALL ON ALL TABLES IN SCHEMA pb FROM anon`).catch(() => {});

  await c.query(sql);
  console.log("SQL applied.");

  const rls = await c.query(`
    select c.relname, c.relrowsecurity as rls
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'pb' and c.relkind = 'r'
    order by 1
  `);
  console.log("RLS flags:");
  rls.rows.forEach((r) => console.log(" ", r.relname, "rls=" + r.rls));

  const pol = await c.query(
    `select count(*)::int as n from pg_policies where schemaname = 'pb'`
  );
  console.log("Policies on pb:", pol.rows[0].n);

  await c.end();
  console.log("DONE");
})().catch((e) => {
  console.error("FAIL:", e.message);
  process.exit(1);
});
