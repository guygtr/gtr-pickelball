/**
 * Compare Auth users vs pb_managers vs bar data owners.
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
  const admin = createClient(t.GTR_DB_SUPABASE_URL, t.GTR_DB_SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data, error } = await admin.auth.admin.listUsers({ perPage: 100 });
  if (error) throw error;

  const c = new Client({
    connectionString: t.GTR_DB_DIRECT_URL || t.GTR_DB_DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  await c.connect();

  const managers = await c.query(`select id, email, name from pb.pb_managers order by email`);
  const barIds = await c.query(`
    select distinct "userId" as id from public."Bottle"
    union
    select distinct "userId" from public."Recipe"
    union
    select distinct "userId" from public."ShoppingItem"
  `);
  const barSet = new Set(barIds.rows.map((r) => r.id));
  const mgrEmails = new Set(managers.rows.map((m) => m.email.toLowerCase()));
  const mgrIds = new Set(managers.rows.map((m) => m.id));

  console.log("=== Auth users (GTR prod) ===");
  for (const u of data.users) {
    const email = (u.email || "").toLowerCase();
    const flags = [];
    if (mgrEmails.has(email) || mgrIds.has(u.id)) flags.push("PICKELBALL");
    if (barSet.has(u.id)) flags.push("BAR_DATA");
    const role = u.user_metadata?.role || "-";
    if (role === "barman") flags.push("META_BARMAN");
    if (role === "manager") flags.push("META_MANAGER");
    if (email === "invite@gtr.com") flags.push("BAR_GUEST");
    console.log(
      `  ${u.email}  role=${role}  apps=[${flags.join(",") || "?"}]  id=${u.id.slice(0, 8)}…`
    );
  }

  console.log("\npb_managers:", managers.rows.length);
  managers.rows.forEach((m) => console.log(" ", m.email, m.id));

  await c.end();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
