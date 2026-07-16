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

(async () => {
  const t = loadTokens();
  const admin = createClient(t.GTR_DB_SUPABASE_URL, t.GTR_DB_SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data, error } = await admin.auth.admin.listUsers({ perPage: 100 });
  if (error) throw error;
  console.log("GTR_PROD Auth:");
  for (const u of data.users) {
    console.log(" ", u.id, u.email);
  }

  const pg = new Client({
    connectionString: t.GTR_DB_DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  await pg.connect();
  const ids = await pg.query(
    `select distinct "userId" as id from "Bottle" where "userId" is not null
     union
     select distinct "userId" from "Recipe" where "userId" is not null
     union
     select distinct "userId" from "ShoppingItem" where "userId" is not null`
  );
  console.log("\nBar data userIds:");
  for (const r of ids.rows) {
    const match = data.users.find((u) => u.id === r.id);
    console.log(" ", r.id, match ? "→ " + match.email : "→ NO AUTH USER ON GTR_PROD");
  }
  await pg.end();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
