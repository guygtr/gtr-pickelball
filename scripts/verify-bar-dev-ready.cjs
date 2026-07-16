/**
 * Quick check: Dev bar data + images + auth after resync.
 */
const { Client } = require("pg");
const { createClient } = require("@supabase/supabase-js");
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

  const counts = await c.query(`
    select
      (select count(*)::int from public."Bottle") as bottles,
      (select count(*)::int from public."Recipe") as recipes,
      (select count(*)::int from public."Bottle" where "imageUrl" like '%gekqmisuvhxfwdhtjefl%') as img_dev
  `);
  console.log("Dev counts:", counts.rows[0]);

  const sample = await c.query(`
    select name, left("imageUrl", 80) as url
    from public."Bottle"
    where "imageUrl" is not null
    limit 2
  `);
  for (const r of sample.rows) {
    process.stdout.write(r.name + " … ");
    try {
      const res = await fetch(r.url);
      console.log("GET", res.status);
    } catch (e) {
      console.log("GET fail", e.message);
    }
  }

  const admin = createClient(t.GTR_DB_DEV_SUPABASE_URL, t.GTR_DB_DEV_SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data, error } = await admin.auth.admin.listUsers({ perPage: 50 });
  if (error) console.log("Auth error:", error.message);
  else console.log("Dev Auth users:", data.users.map((u) => u.email).join(", "));

  await c.end();
  console.log("READY for: cd Projects/bar-manager ; npm run dev");
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
