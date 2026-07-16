/**
 * Security audit of GTR-Database (prod): RLS, policies, grants on pb + public app tables.
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

  console.log("=== Tables of interest: RLS ===");
  const tables = await c.query(`
    select n.nspname as schema, c.relname as table_name,
           c.relrowsecurity as rls, c.relforcerowsecurity as force_rls
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where c.relkind = 'r'
      and (
        n.nspname = 'pb'
        or (n.nspname = 'public' and c.relname in (
          'Bottle','Recipe','RecipeIngredient','ShoppingItem'
        ))
      )
    order by 1, 2
  `);
  tables.rows.forEach((r) =>
    console.log(`  ${r.schema}.${r.table_name} rls=${r.rls} force=${r.force_rls}`)
  );

  console.log("\n=== Policies pb + public bar ===");
  const pol = await c.query(`
    select schemaname, tablename, policyname, cmd, roles
    from pg_policies
    where schemaname = 'pb'
       or (schemaname = 'public' and tablename in (
         'Bottle','Recipe','RecipeIngredient','ShoppingItem'
       ))
    order by 1, 2, 3
  `);
  console.log("count:", pol.rows.length);
  pol.rows.forEach((p) =>
    console.log(`  ${p.schemaname}.${p.tablename}.${p.policyname} [${p.cmd}] ${p.roles}`)
  );

  console.log("\n=== Grants (anon / authenticated / service_role) ===");
  const grants = await c.query(`
    select table_schema, table_name, grantee, string_agg(privilege_type, ',' order by privilege_type) as privs
    from information_schema.role_table_grants
    where grantee in ('anon','authenticated','service_role','public')
      and (
        table_schema = 'pb'
        or (table_schema = 'public' and table_name in (
          'Bottle','Recipe','RecipeIngredient','ShoppingItem'
        ))
      )
    group by 1, 2, 3
    order by 1, 2, 3
  `);
  grants.rows.forEach((g) =>
    console.log(`  ${g.table_schema}.${g.table_name} → ${g.grantee}: ${g.privs}`)
  );

  console.log("\n=== PK / FK bar ===");
  const cons = await c.query(`
    select rel.relname, c.contype, c.conname
    from pg_constraint c
    join pg_class rel on rel.oid = c.conrelid
    join pg_namespace n on n.oid = rel.relnamespace
    where n.nspname = 'public'
      and rel.relname in ('Bottle','Recipe','RecipeIngredient','ShoppingItem')
    order by 1, 2
  `);
  cons.rows.forEach((r) => console.log(`  ${r.relname} ${r.contype} ${r.conname}`));

  await c.end();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
