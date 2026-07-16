/**
 * Remap bar table userIds to a known Auth user id on target DB.
 * Usage (run with NODE_PATH or from pickelball):
 *   node remap-bar-userids.cjs --target GTR_DB_DATABASE_URL --to-auth-email guy.gtr@gmail.com --auth-url-key GTR_DB_SUPABASE_URL --auth-key GTR_DB_SUPABASE_SERVICE_ROLE_KEY
 */
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

function arg(name, def) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : def;
}

(async () => {
  const t = loadTokens();
  const dbKey = arg("--target", "GTR_DB_DATABASE_URL");
  const email = (arg("--to-auth-email", "guy.gtr@gmail.com") || "").toLowerCase();
  const authUrlKey = arg("--auth-url-key", "GTR_DB_SUPABASE_URL");
  const authKeyKey = arg("--auth-key", "GTR_DB_SUPABASE_SERVICE_ROLE_KEY");

  const admin = createClient(t[authUrlKey], t[authKeyKey], {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data, error } = await admin.auth.admin.listUsers({ perPage: 100 });
  if (error) throw error;
  const user = data.users.find((u) => (u.email || "").toLowerCase() === email);
  if (!user) {
    console.error("Auth user not found:", email);
    console.error(
      "Available:",
      data.users.map((u) => u.email).join(", ")
    );
    process.exit(1);
  }
  console.log("Target auth:", user.id, user.email);

  const pg = new Client({
    connectionString: t[dbKey],
    ssl: { rejectUnauthorized: false },
  });
  await pg.connect();

  const tables = ["Bottle", "Recipe", "RecipeIngredient", "ShoppingItem"];
  for (const table of tables) {
    // RecipeIngredient may not have userId
    const cols = await pg.query(
      `select column_name from information_schema.columns
       where table_schema='public' and table_name=$1 and column_name='userId'`,
      [table]
    );
    if (!cols.rows.length) {
      console.log(table, "no userId column — skip");
      continue;
    }
    const r = await pg.query(
      `update "${table}" set "userId" = $1 where "userId" is distinct from $1`,
      [user.id]
    );
    console.log(table, "updated rows:", r.rowCount);
  }

  const check = await pg.query(`
    select "userId", count(*)::int as n from "Bottle" group by 1
  `);
  console.log("Bottle by userId:", check.rows);
  await pg.end();
  console.log("DONE remap on", dbKey);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
