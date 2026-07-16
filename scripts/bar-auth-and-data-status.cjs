const { createClient } = require("@supabase/supabase-js");
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

async function countBar(url, label) {
  const c = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  await c.connect();
  const r = await c.query(`
    select
      (select count(*)::int from "Bottle") as bottles,
      (select count(*)::int from "Recipe") as recipes,
      (select count(*)::int from "RecipeIngredient") as ingredients,
      (select count(*)::int from "ShoppingItem") as shopping
  `);
  const users = await c.query(`
    select "userId", count(*)::int as n from "Bottle" group by 1 order by n desc nulls last limit 10
  `).catch(() => ({ rows: [] }));
  console.log(label, r.rows[0]);
  console.log(label, "top userIds bottles:", users.rows);
  await c.end();
}

(async () => {
  const t = loadTokens();
  console.log("=== Data on GTR ===");
  await countBar(t.GTR_DB_DATABASE_URL, "PROD");
  await countBar(t.GTR_DB_DEV_DATABASE_URL, "DEV");

  console.log("\n=== Auth API probes ===");
  for (const [name, urlKey, keyKey] of [
    ["BAR", "BAR_SUPABASE_URL", "BAR_SUPABASE_SERVICE_ROLE_KEY"],
    ["GTR_PROD", "GTR_DB_SUPABASE_URL", "GTR_DB_SUPABASE_SERVICE_ROLE_KEY"],
    ["GTR_DEV", "GTR_DB_DEV_SUPABASE_URL", "GTR_DB_DEV_SUPABASE_SERVICE_ROLE_KEY"],
  ]) {
    const url = t[urlKey];
    const key = t[keyKey];
    if (!url || !key) {
      console.log(name, "missing keys");
      continue;
    }
    const admin = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data, error } = await admin.auth.admin.listUsers({ perPage: 50 });
    if (error) {
      console.log(name, "Auth FAIL:", error.message);
    } else {
      console.log(
        name,
        "Auth users:",
        data.users.length,
        data.users.map((u) => u.email).join(", ")
      );
    }
  }

  // backup export counts
  const metaPath = "D:/GrokBuild/Backups/db/bar-prod-export/_meta.json";
  if (fs.existsSync(metaPath)) {
    const meta = JSON.parse(fs.readFileSync(metaPath, "utf8"));
    console.log("\nBackup bar-prod-export:", meta.exportedAt);
    for (const [k, v] of Object.entries(meta.tables)) {
      console.log(" ", k, v.rowCount);
    }
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
