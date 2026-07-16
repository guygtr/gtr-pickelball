const { Client } = require("pg");
const fs = require("fs");
const path = require("path");

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

function q(id) {
  return `"${String(id).replace(/"/g, '""')}"`;
}

async function exp(urlKey, schema, out, only) {
  const tokens = loadTokens();
  const url = tokens[urlKey];
  if (!url) throw new Error("Missing " + urlKey);
  fs.mkdirSync(out, { recursive: true });
  const c = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  await c.connect();
  let tables = (
    await c.query(
      `select table_name from information_schema.tables
       where table_schema=$1 and table_type='BASE TABLE' order by 1`,
      [schema]
    )
  ).rows.map((r) => r.table_name);
  if (only) tables = tables.filter((t) => only.includes(t));
  const meta = { source: urlKey, schema, exportedAt: new Date().toISOString(), tables: {} };
  for (const table of tables) {
    const cols = (
      await c.query(
        `select column_name, data_type, udt_name, is_nullable
         from information_schema.columns
         where table_schema=$1 and table_name=$2 order by ordinal_position`,
        [schema, table]
      )
    ).rows;
    const data = (await c.query(`select * from ${q(schema)}.${q(table)}`)).rows;
    const rows = data.map((row) => {
      const o = {};
      for (const [k, v] of Object.entries(row)) {
        o[k] = v instanceof Date ? v.toISOString() : v;
      }
      return o;
    });
    meta.tables[table] = { columns: cols, rowCount: rows.length };
    fs.writeFileSync(path.join(out, `${table}.json`), JSON.stringify(rows));
    console.log(`${schema}.${table}: ${rows.length} rows`);
  }
  fs.writeFileSync(path.join(out, "_meta.json"), JSON.stringify(meta, null, 2));
  await c.end();
  console.log("OK", out);
}

(async () => {
  await exp("GTR_DB_DATABASE_URL", "pb", "D:/GrokBuild/Backups/db/pb-prod-export", null);
  await exp("BAR_DATABASE_URL", "public", "D:/GrokBuild/Backups/db/bar-prod-export", [
    "Bottle",
    "Recipe",
    "RecipeIngredient",
    "ShoppingItem",
  ]);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
