/**
 * Add missing PK / UNIQUE on GTR-Database-Dev pb_* tables after JSON import.
 * Fixes: prisma upsert → "no unique or exclusion constraint matching the ON CONFLICT"
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

async function hasPk(c, schema, table) {
  const r = await c.query(
    `select 1 from information_schema.table_constraints
     where table_schema=$1 and table_name=$2 and constraint_type='PRIMARY KEY'`,
    [schema, table]
  );
  return r.rows.length > 0;
}

async function hasUnique(c, schema, table, column) {
  const r = await c.query(
    `select tc.constraint_name
     from information_schema.table_constraints tc
     join information_schema.constraint_column_usage ccu
       on tc.constraint_name = ccu.constraint_name
      and tc.table_schema = ccu.table_schema
     where tc.table_schema=$1 and tc.table_name=$2
       and tc.constraint_type in ('UNIQUE','PRIMARY KEY')
       and ccu.column_name=$3`,
    [schema, table, column]
  );
  return r.rows.length > 0;
}

async function addPk(c, schema, table, col = "id") {
  if (await hasPk(c, schema, table)) {
    console.log(`  PK ok: ${schema}.${table}`);
    return;
  }
  // drop nulls if any
  await c.query(
    `delete from "${schema}"."${table}" where "${col}" is null`
  ).catch(() => {});
  await c.query(
    `alter table "${schema}"."${table}" add primary key ("${col}")`
  );
  console.log(`  PK added: ${schema}.${table}(${col})`);
}

(async () => {
  const t = loadTokens();
  const url = t.GTR_DB_DEV_DIRECT_URL || t.GTR_DB_DEV_DATABASE_URL;
  const c = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  await c.connect();
  console.log("Fixing constraints on GTR-Database-Dev schema pb…");

  const tables = [
    "pb_managers",
    "pb_leagues",
    "pb_courts",
    "pb_players",
    "pb_sessions",
    "pb_co_managers",
    "pb_attendances",
    "pb_matches",
  ];

  for (const table of tables) {
    try {
      await addPk(c, "pb", table, "id");
    } catch (e) {
      console.error(`  PK fail ${table}:`, e.message);
    }
  }

  // email unique for managers (Prisma + upsert safety)
  try {
    if (!(await hasUnique(c, "pb", "pb_managers", "email"))) {
      await c.query(
        `alter table pb.pb_managers add constraint pb_managers_email_key unique (email)`
      );
      console.log("  UNIQUE email on pb_managers");
    } else {
      console.log("  UNIQUE email ok");
    }
  } catch (e) {
    console.error("  UNIQUE email:", e.message);
  }

  // helpful indexes used by app
  const indexes = [
    `create index if not exists pb_leagues_managerId_idx on pb.pb_leagues ("managerId")`,
    `create index if not exists pb_players_leagueId_idx on pb.pb_players ("leagueId")`,
    `create index if not exists pb_sessions_leagueId_idx on pb.pb_sessions ("leagueId")`,
    `create index if not exists pb_matches_sessionId_idx on pb.pb_matches ("sessionId")`,
    `create unique index if not exists pb_attendances_session_player_uidx on pb.pb_attendances ("sessionId", "playerId")`,
    `create unique index if not exists pb_co_managers_league_manager_uidx on pb.pb_co_managers ("leagueId", "managerId")`,
  ];
  for (const sql of indexes) {
    try {
      await c.query(sql);
    } catch (e) {
      console.warn("  index:", e.message);
    }
  }

  // smoke: upsert-like conflict target
  const test = await c.query(
    `select conname from pg_constraint
     where conrelid = 'pb.pb_managers'::regclass and contype in ('p','u')`
  );
  console.log(
    "pb_managers constraints:",
    test.rows.map((r) => r.conname).join(", ")
  );

  await c.end();
  console.log("DONE — reload /leagues");
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
