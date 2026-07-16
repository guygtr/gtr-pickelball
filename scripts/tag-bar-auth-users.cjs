/**
 * Tag Auth users that belong to Bar with user_metadata.apps += 'bar'
 * on GTR-Database prod (shared Auth multi-app).
 *
 * Criteria: role barman | invite@gtr.com | has Bottle/Recipe/Shopping data
 * Does NOT tag pure Pickelball managers.
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
  const c = new Client({
    connectionString: t.GTR_DB_DIRECT_URL || t.GTR_DB_DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  await c.connect();

  const barIds = await c.query(`
    select distinct "userId" as id from public."Bottle"
    union select distinct "userId" from public."Recipe"
    union select distinct "userId" from public."ShoppingItem"
  `);
  const barSet = new Set(barIds.rows.map((r) => r.id));
  await c.end();

  const { data, error } = await admin.auth.admin.listUsers({ perPage: 200 });
  if (error) throw error;

  for (const u of data.users) {
    const email = (u.email || "").toLowerCase();
    const role = u.user_metadata?.role || "";
    const isBar =
      barSet.has(u.id) ||
      role === "barman" ||
      email === "invite@gtr.com" ||
      email === "guy.gtr@gmail.com"; // admin Bar + shared SSO

    if (!isBar) {
      console.log("skip (not bar):", email, "role=" + role);
      continue;
    }

    const meta = { ...(u.user_metadata || {}) };
    const apps = Array.isArray(meta.apps) ? [...meta.apps] : [];
    if (!apps.includes("bar")) apps.push("bar");
    meta.apps = apps;
    meta.app = meta.app || "bar";
    if (email === "invite@gtr.com" && !meta.role) meta.role = "guest";
    if (barSet.has(u.id) && !meta.role && role !== "manager") {
      // keep existing; do not force barman on multi-app admin
    }

    const { error: updErr } = await admin.auth.admin.updateUserById(u.id, {
      user_metadata: meta,
    });
    if (updErr) {
      console.error("FAIL", email, updErr.message);
    } else {
      console.log("tagged bar:", email, "apps=", meta.apps, "role=", meta.role || "-");
    }
  }
  console.log("DONE");
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
