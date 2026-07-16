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
    connectionString: t.GTR_DB_DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  await c.connect();
  const r = await c.query(
    `select table_name from information_schema.tables
     where table_schema='public'
       and table_name in ('Bottle','Recipe','RecipeIngredient','ShoppingItem')
     order by 1`
  );
  console.log("tables:", r.rows.map((x) => x.table_name).join(", "));
  const n = await c.query(
    `select (select count(*)::int from "Bottle") as bottles,
            (select count(*)::int from "Recipe") as recipes,
            (select count(*)::int from "RecipeIngredient") as ingredients,
            (select count(*)::int from "ShoppingItem") as shopping`
  );
  console.log(n.rows[0]);
  await c.end();
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
