/**
 * Apply bar multi-tenant RLS on GTR-Database (prod).
 * SQL: Projects/bar-manager/supabase/migrations/20260716_rls_bar_userid.sql
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
  const url = t.GTR_DB_DIRECT_URL || t.GTR_DB_DATABASE_URL;
  if (!url) {
    console.error("Missing GTR_DB_DIRECT_URL / GTR_DB_DATABASE_URL");
    process.exit(1);
  }

  const sqlPath = path.join(
    "D:",
    "GrokBuild",
    "Projects",
    "bar-manager",
    "supabase",
    "migrations",
    "20260716_rls_bar_userid.sql"
  );
  const sql = fs.readFileSync(sqlPath, "utf8");

  const c = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  await c.connect();
  console.log("Applying bar RLS to GTR-Database (prod)…");
  console.log("  file:", sqlPath);

  await c.query(sql);
  console.log("SQL applied.");

  const rls = await c.query(`
    select c.relname, c.relrowsecurity as rls, c.relforcerowsecurity as force_rls
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind = 'r'
      and c.relname in ('Bottle','Recipe','RecipeIngredient','ShoppingItem')
    order by 1
  `);
  console.log("RLS flags:");
  rls.rows.forEach((r) => console.log(" ", r.relname, "rls=" + r.rls, "force=" + r.force_rls));

  const pol = await c.query(`
    select tablename, policyname, cmd
    from pg_policies
    where schemaname = 'public'
      and tablename in ('Bottle','Recipe','RecipeIngredient','ShoppingItem')
    order by 1, 2
  `);
  console.log("Policies:", pol.rows.length);
  pol.rows.forEach((p) => console.log(" ", p.tablename + "." + p.policyname, "[" + p.cmd + "]"));

  await c.end();
  console.log("DONE");
})().catch((e) => {
  console.error("FAIL:", e.message);
  process.exit(1);
});
