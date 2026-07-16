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

function redact(u) {
  return u.replace(/:\/\/([^:]+):([^@]+)@/, "://$1:***@");
}

(async () => {
  const t = loadTokens();
  const ref = "gyeofcfjgpthwsirjcya";
  const pwd = encodeURIComponent(t.BAR_DATABASE_PASSWORD || "");
  const candidates = [
    ["token BAR_DATABASE_URL", t.BAR_DATABASE_URL],
    ["pooler 6543", `postgresql://postgres.${ref}:${pwd}@aws-1-ca-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true`],
    ["pooler 5432", `postgresql://postgres.${ref}:${pwd}@aws-1-ca-central-1.pooler.supabase.com:5432/postgres`],
    ["pooler aws-0 6543", `postgresql://postgres.${ref}:${pwd}@aws-0-ca-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true`],
    ["db host", `postgresql://postgres:${pwd}@db.${ref}.supabase.co:5432/postgres`],
  ];

  for (const [name, url] of candidates) {
    if (!url) {
      console.log(name, "missing");
      continue;
    }
    const c = new Client({ connectionString: url, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 8000 });
    try {
      await c.connect();
      const r = await c.query(
        `select count(*)::int as n from information_schema.tables where table_schema='public' and table_name in ('Bottle','Recipe')`
      );
      console.log("OK", name, "tables=", r.rows[0].n, redact(url));
      await c.end();
    } catch (e) {
      console.log("FAIL", name, e.message.split("\n")[0]);
    }
  }

  // Also check data already on GTR prod/dev
  for (const [name, key] of [
    ["GTR_PROD", "GTR_DB_DATABASE_URL"],
    ["GTR_DEV", "GTR_DB_DEV_DATABASE_URL"],
  ]) {
    const c = new Client({
      connectionString: t[key],
      ssl: { rejectUnauthorized: false },
    });
    try {
      await c.connect();
      const r = await c.query(
        `select
          (select count(*)::int from "Bottle") as bottles,
          (select count(*)::int from "Recipe") as recipes`
      );
      console.log(name, "bar data:", r.rows[0]);
      await c.end();
    } catch (e) {
      console.log(name, "FAIL", e.message.split("\n")[0]);
    }
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
