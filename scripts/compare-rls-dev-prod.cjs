/**
 * Compare RLS / policies / grants between GTR-Database and GTR-Database-Dev (schema pb).
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

async function connect(url) {
  const c = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  await c.connect();
  return c;
}

async function snapshot(c, label) {
  const tables = await c.query(`
    select c.relname as table_name,
           c.relrowsecurity as rls_enabled,
           c.relforcerowsecurity as rls_forced
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'pb' and c.relkind = 'r'
    order by 1
  `);

  const policies = await c.query(`
    select schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
    from pg_policies
    where schemaname = 'pb'
    order by tablename, policyname
  `);

  const grants = await c.query(`
    select grantee, table_name, string_agg(privilege_type, ', ' order by privilege_type) as privs
    from information_schema.role_table_grants
    where table_schema = 'pb'
      and grantee in ('anon', 'authenticated', 'service_role', 'postgres')
    group by grantee, table_name
    order by table_name, grantee
  `);

  const fks = await c.query(`
    select tc.table_name, tc.constraint_name, kcu.column_name,
           ccu.table_name as foreign_table, ccu.column_name as foreign_column
    from information_schema.table_constraints tc
    join information_schema.key_column_usage kcu
      on tc.constraint_name = kcu.constraint_name and tc.table_schema = kcu.table_schema
    join information_schema.constraint_column_usage ccu
      on ccu.constraint_name = tc.constraint_name and ccu.table_schema = tc.table_schema
    where tc.constraint_type = 'FOREIGN KEY' and tc.table_schema = 'pb'
    order by 1, 2
  `);

  return {
    label,
    tables: tables.rows,
    policies: policies.rows,
    grants: grants.rows,
    fks: fks.rows,
  };
}

function printSnap(s) {
  console.log("\n========== " + s.label + " ==========");
  console.log("Tables RLS:");
  for (const t of s.tables) {
    console.log(
      `  ${t.table_name}: rls=${t.rls_enabled} force=${t.rls_forced}`
    );
  }
  console.log(`Policies count: ${s.policies.length}`);
  for (const p of s.policies) {
    console.log(`  ${p.tablename}.${p.policyname} [${p.cmd}] roles=${p.roles}`);
  }
  console.log(`FK count: ${s.fks.length}`);
  console.log(`Grants (sample): ${s.grants.length} rows`);
}

(async () => {
  const t = loadTokens();
  const prod = await connect(t.GTR_DB_DIRECT_URL || t.GTR_DB_DATABASE_URL);
  const dev = await connect(t.GTR_DB_DEV_DIRECT_URL || t.GTR_DB_DEV_DATABASE_URL);

  const sp = await snapshot(prod, "PROD GTR-Database");
  const sd = await snapshot(dev, "DEV GTR-Database-Dev");
  await prod.end();
  await dev.end();

  printSnap(sp);
  printSnap(sd);

  console.log("\n========== DELTA ==========");
  const prodRls = Object.fromEntries(sp.tables.map((x) => [x.table_name, x.rls_enabled]));
  const devRls = Object.fromEntries(sd.tables.map((x) => [x.table_name, x.rls_enabled]));
  const allTables = new Set([...Object.keys(prodRls), ...Object.keys(devRls)]);
  for (const name of [...allTables].sort()) {
    const p = prodRls[name];
    const d = devRls[name];
    if (p !== d) console.log(`RLS mismatch ${name}: prod=${p} dev=${d}`);
  }
  if (sp.policies.length !== sd.policies.length) {
    console.log(`Policy count: prod=${sp.policies.length} dev=${sd.policies.length}`);
  }
  const prodPol = new Set(sp.policies.map((p) => `${p.tablename}::${p.policyname}`));
  const devPol = new Set(sd.policies.map((p) => `${p.tablename}::${p.policyname}`));
  for (const p of prodPol) if (!devPol.has(p)) console.log("Missing on DEV:", p);
  for (const p of devPol) if (!prodPol.has(p)) console.log("Extra on DEV:", p);
  if (sp.fks.length !== sd.fks.length) {
    console.log(`FK count: prod=${sp.fks.length} dev=${sd.fks.length}`);
  }

  console.log("\nVerdict:");
  const allDevRls = sd.tables.every((t) => t.rls_enabled);
  const allProdRls = sp.tables.every((t) => t.rls_enabled);
  console.log("  Prod all pb RLS on:", allProdRls);
  console.log("  Dev  all pb RLS on:", allDevRls);
  console.log("  Dev parity with prod policies:", sp.policies.length === sd.policies.length && [...prodPol].every((p) => devPol.has(p)));
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
