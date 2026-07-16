/**
 * Mirror FK constraints from prod GTR-Database pb schema onto Dev (best-effort).
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

(async () => {
  const t = loadTokens();
  const prod = await connect(t.GTR_DB_DIRECT_URL || t.GTR_DB_DATABASE_URL);
  const dev = await connect(t.GTR_DB_DEV_DIRECT_URL || t.GTR_DB_DEV_DATABASE_URL);

  // pg_get_constraintdef for FKs on pb
  const fks = await prod.query(`
    select con.conname,
           rel.relname as table_name,
           pg_get_constraintdef(con.oid) as def
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'pb' and con.contype = 'f'
    order by rel.relname, con.conname
  `);

  console.log("Prod FKs:", fks.rows.length);
  let ok = 0;
  let fail = 0;
  for (const row of fks.rows) {
    const sql = `alter table pb."${row.table_name}" add constraint "${row.conname}" ${row.def}`;
    try {
      // drop if exists
      await dev.query(
        `alter table pb."${row.table_name}" drop constraint if exists "${row.conname}"`
      );
      await dev.query(sql);
      console.log("  OK", row.conname);
      ok++;
    } catch (e) {
      console.warn("  FAIL", row.conname, e.message.split("\n")[0]);
      fail++;
    }
  }

  const count = await dev.query(`
    select count(*)::int as n from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'pb' and con.contype = 'f'
  `);
  console.log(`Done: applied=${ok} failed=${fail} dev_fk_count=${count.rows[0].n}`);
  await prod.end();
  await dev.end();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
