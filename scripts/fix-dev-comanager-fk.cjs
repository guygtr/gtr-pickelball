/**
 * Fix orphan co_managers.managerId then add FK to pb_managers.
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
    connectionString: t.GTR_DB_DEV_DIRECT_URL || t.GTR_DB_DEV_DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  await c.connect();

  const orphans = await c.query(`
    select c.id, c."managerId", c."leagueId"
    from pb.pb_co_managers c
    left join pb.pb_managers m on m.id = c."managerId"
    where m.id is null
  `);
  console.log("Orphan co_managers:", orphans.rows.length);
  orphans.rows.forEach((r) => console.log(" ", r));

  if (orphans.rows.length) {
    // Drop orphan co-manager rows (invalid after auth re-key) — safer than pointing to random manager
    const del = await c.query(`
      delete from pb.pb_co_managers c
      where not exists (select 1 from pb.pb_managers m where m.id = c."managerId")
      returning id
    `);
    console.log("Deleted orphans:", del.rowCount);
  }

  await c.query(`alter table pb.pb_co_managers drop constraint if exists pb_co_managers_managerId_fkey`);
  await c.query(`
    alter table pb.pb_co_managers
    add constraint pb_co_managers_managerId_fkey
    foreign key ("managerId") references pb.pb_managers(id)
    on update cascade on delete cascade
  `);
  console.log("FK pb_co_managers_managerId_fkey OK");

  const n = await c.query(`
    select count(*)::int as n from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'pb' and con.contype = 'f'
  `);
  console.log("Dev FK count:", n.rows[0].n);
  await c.end();
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
