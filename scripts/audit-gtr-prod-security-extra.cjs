/**
 * Extra prod security checks: all public tables RLS + role privileges.
 */
const { Client } = require("pg");
const fs = require("fs");

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
  const c = new Client({
    connectionString: t.GTR_DB_DIRECT_URL || t.GTR_DB_DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  await c.connect();

  console.log("=== ALL public base tables RLS ===");
  const r = await c.query(`
    select c.relname, c.relrowsecurity as rls
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'r'
    order by 1
  `);
  r.rows.forEach((x) => console.log(" ", x.relname, "rls=" + x.rls));

  console.log("\n=== app schemas ===");
  const s = await c.query(`
    select nspname from pg_namespace
    where nspname not like 'pg_%'
      and nspname not in ('information_schema','graphql','graphql_public','realtime','storage','vault','extensions','supabase_functions','supabase_migrations','_realtime','cron','net','pgsodium','pgsodium_masks')
    order by 1
  `);
  s.rows.forEach((x) => console.log(" ", x.nspname));

  console.log("\n=== role privileges (anon / authenticated / service_role) ===");
  const a = await c.query(`
    select n.nspname || '.' || c.relname as tbl,
           has_table_privilege('anon', c.oid, 'SELECT') as anon_sel,
           has_table_privilege('authenticated', c.oid, 'SELECT') as auth_sel,
           has_table_privilege('service_role', c.oid, 'SELECT') as svc_sel
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where c.relkind = 'r' and (
      n.nspname = 'pb'
      or (n.nspname = 'public' and c.relname in (
        'Bottle','Recipe','RecipeIngredient','ShoppingItem'
      ))
    )
    order by 1
  `);
  a.rows.forEach((x) =>
    console.log(
      " ",
      x.tbl,
      "anon_sel=" + x.anon_sel,
      "auth_sel=" + x.auth_sel,
      "svc_sel=" + x.svc_sel
    )
  );

  console.log("\n=== policy count summary ===");
  const pol = await c.query(`
    select schemaname, count(*)::int as n
    from pg_policies
    where schemaname in ('pb','public')
    group by 1
    order by 1
  `);
  pol.rows.forEach((p) => console.log(" ", p.schemaname, p.n));

  console.log("\n=== _prisma_migrations privileges ===");
  const m = await c.query(`
    select
      has_table_privilege('anon', 'public._prisma_migrations', 'SELECT') as anon_sel,
      has_table_privilege('authenticated', 'public._prisma_migrations', 'SELECT') as auth_sel
  `);
  console.log(" ", m.rows[0]);

  console.log("\n=== bourses privileges + policy count ===");
  const b = await c.query(`
    select
      has_table_privilege('anon', 'public.bourses_user', 'SELECT') as anon_sel,
      has_table_privilege('authenticated', 'public.bourses_user', 'SELECT') as auth_sel
  `);
  console.log("  bourses_user", b.rows[0]);
  const bp = await c.query(`
    select tablename, policyname
    from pg_policies
    where schemaname = 'public' and tablename like 'bourses%'
    order by 1, 2
  `);
  console.log("  bourses policies:", bp.rows.length);
  bp.rows.forEach((r) => console.log("   ", r.tablename + "." + r.policyname));

  await c.end();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
