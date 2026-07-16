/**
 * Import JSON export into target DB (structure from _meta + CREATE TABLE, then data).
 * Usage:
 *   node scripts/import-gtr-data.cjs --target GTR_DB_DEV_DATABASE_URL --dir D:/GrokBuild/Backups/db/pb-prod-export --schema pb
 *   node scripts/import-gtr-data.cjs --target GTR_DB_DATABASE_URL --dir D:/GrokBuild/Backups/db/bar-prod-export --schema public
 */
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

function parseArgs() {
  const out = { target: null, dir: null, schema: null, dataOnly: false };
  const a = process.argv.slice(2);
  for (let i = 0; i < a.length; i++) {
    if (a[i] === "--target") out.target = a[++i];
    else if (a[i] === "--dir") out.dir = a[++i];
    else if (a[i] === "--schema") out.schema = a[++i];
    else if (a[i] === "--data-only") out.dataOnly = true;
  }
  return out;
}

function q(id) {
  return `"${String(id).replace(/"/g, '""')}"`;
}

function mapType(col) {
  const udt = col.udt_name;
  const dt = col.data_type;
  if (udt === "uuid") return "uuid";
  if (udt === "text") return "text";
  if (udt === "bool") return "boolean";
  if (udt === "int4") return "integer";
  if (udt === "int8") return "bigint";
  if (udt === "float8") return "double precision";
  if (udt === "float4") return "real";
  if (udt === "jsonb") return "jsonb";
  if (udt === "json") return "json";
  if (udt === "timestamptz") return "timestamptz";
  if (udt === "timestamp") return "timestamp";
  if (udt === "numeric") return "numeric";
  if (udt?.startsWith("_")) return udt.slice(1) + "[]";
  if (dt === "USER-DEFINED") return udt;
  return dt;
}

async function main() {
  const args = parseArgs();
  if (!args.target || !args.dir || !args.schema) {
    console.error("Need --target KEY --dir path --schema name");
    process.exit(1);
  }
  const tokens = loadTokens();
  const url = tokens[args.target];
  if (!url) throw new Error("Missing token " + args.target);

  const meta = JSON.parse(fs.readFileSync(path.join(args.dir, "_meta.json"), "utf8"));
  const c = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  await c.connect();
  await c.query(`CREATE SCHEMA IF NOT EXISTS ${q(args.schema)}`);

  const orderHint = [
    "pb_managers",
    "pb_leagues",
    "pb_courts",
    "pb_players",
    "pb_sessions",
    "pb_co_managers",
    "pb_attendances",
    "pb_matches",
    "Bottle",
    "Recipe",
    "RecipeIngredient",
    "ShoppingItem",
  ];
  const tableNames = Object.keys(meta.tables);
  const ordered = [
    ...orderHint.filter((t) => tableNames.includes(t)),
    ...tableNames.filter((t) => !orderHint.includes(t)),
  ];

  for (const table of ordered) {
    const info = meta.tables[table];
    const rows = JSON.parse(fs.readFileSync(path.join(args.dir, `${table}.json`), "utf8"));
    if (!args.dataOnly) {
      const colDefs = info.columns.map((col) => {
        let d = `${q(col.column_name)} ${mapType(col)}`;
        if (col.is_nullable === "NO") d += " NOT NULL";
        return d;
      });
      await c.query(`DROP TABLE IF EXISTS ${q(args.schema)}.${q(table)} CASCADE`);
      await c.query(`CREATE TABLE ${q(args.schema)}.${q(table)} (${colDefs.join(", ")})`);
      // Prisma upsert needs a real unique/PK target (ON CONFLICT)
      if (info.columns.some((col) => col.column_name === "id")) {
        try {
          await c.query(
            `alter table ${q(args.schema)}.${q(table)} add primary key (${q("id")})`
          );
        } catch (e) {
          console.warn(`  PK ${table}:`, e.message);
        }
      }
    }

    if (!rows.length) {
      console.log(`${args.schema}.${table}: 0 rows`);
      continue;
    }
    await c.query(`TRUNCATE TABLE ${q(args.schema)}.${q(table)} CASCADE`).catch(() => {});
    const colNames = info.columns.map((c) => c.column_name);
    const colList = colNames.map(q).join(", ");
    let n = 0;
    for (const row of rows) {
      const vals = colNames.map((name) => {
        let v = row[name];
        // restore dates
        if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}T/.test(v)) {
          const d = new Date(v);
          if (!Number.isNaN(d.getTime())) v = d;
        }
        return v;
      });
      const ph = vals.map((_, i) => `$${i + 1}`).join(", ");
      await c.query(
        `insert into ${q(args.schema)}.${q(table)} (${colList}) values (${ph})`,
        vals
      );
      n++;
    }
    console.log(`${args.schema}.${table}: ${n} rows`);
  }
  await c.end();
  console.log("IMPORT DONE");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
