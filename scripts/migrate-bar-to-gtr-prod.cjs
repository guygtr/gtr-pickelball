/**
 * Full migration: bar-personnel-manager → GTR-Database (prod)
 * - App tables: Bottle, Recipe, RecipeIngredient, ShoppingItem (structure + PK/FK/indexes + data)
 * - Auth users: copy auth.users + auth.identities (preserve ids + password hashes when possible)
 *
 * Usage: cd Projects/GTR-Pickelball && node scripts/migrate-bar-to-gtr-prod.cjs
 * Tokens: BAR_* (source), GTR_DB_* (target prod)
 */
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

function q(id) {
  return `"${String(id).replace(/"/g, '""')}"`;
}

async function connect(url, label) {
  const c = new Client({
    connectionString: url,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
  });
  await c.connect();
  console.log("Connected:", label);
  return c;
}

async function listAppTables(c) {
  const r = await c.query(`
    select table_name from information_schema.tables
    where table_schema='public' and table_type='BASE TABLE'
      and table_name in ('Bottle','Recipe','RecipeIngredient','ShoppingItem','_prisma_migrations')
    order by 1
  `);
  return r.rows.map((x) => x.table_name);
}

async function getCreateLikeDefs(src) {
  // Use pg_dump style via information_schema + constraints from source
  const tables = ["Bottle", "Recipe", "RecipeIngredient", "ShoppingItem"];
  const result = {};
  for (const table of tables) {
    const cols = await src.query(
      `
      select a.attname as column_name,
             pg_catalog.format_type(a.atttypid, a.atttypmod) as data_type,
             a.attnotnull as not_null,
             pg_get_expr(ad.adbin, ad.adrelid) as default_expr
      from pg_attribute a
      join pg_class c on c.oid = a.attrelid
      join pg_namespace n on n.oid = c.relnamespace
      left join pg_attrdef ad on ad.adrelid = a.attrelid and ad.adnum = a.attnum
      where n.nspname = 'public' and c.relname = $1
        and a.attnum > 0 and not a.attisdropped
      order by a.attnum
    `,
      [table]
    );
    result[table] = cols.rows;
  }
  return result;
}

async function getConstraints(src) {
  const r = await src.query(`
    select c.conname,
           rel.relname as table_name,
           c.contype,
           pg_get_constraintdef(c.oid) as def
    from pg_constraint c
    join pg_class rel on rel.oid = c.conrelid
    join pg_namespace n on n.oid = rel.relnamespace
    where n.nspname = 'public'
      and rel.relname in ('Bottle','Recipe','RecipeIngredient','ShoppingItem')
    order by case c.contype when 'p' then 0 when 'u' then 1 when 'f' then 2 else 3 end, rel.relname
  `);
  return r.rows;
}

async function getIndexes(src) {
  const r = await src.query(`
    select indexname, indexdef
    from pg_indexes
    where schemaname = 'public'
      and tablename in ('Bottle','Recipe','RecipeIngredient','ShoppingItem')
      and indexname not like '%_pkey'
    order by tablename, indexname
  `);
  return r.rows;
}

async function recreateAppTables(src, dst) {
  const colMap = await getCreateLikeDefs(src);
  const tablesOrder = ["Bottle", "Recipe", "RecipeIngredient", "ShoppingItem"];

  // Drop in reverse FK order
  for (const table of ["ShoppingItem", "RecipeIngredient", "Recipe", "Bottle"]) {
    await dst.query(`drop table if exists public.${q(table)} cascade`);
    console.log("Dropped public." + table);
  }

  for (const table of tablesOrder) {
    const cols = colMap[table];
    if (!cols?.length) throw new Error("No columns for " + table);
    const defs = cols.map((col) => {
      let d = `${q(col.column_name)} ${col.data_type}`;
      if (col.not_null) d += " NOT NULL";
      // skip defaults that reference sequences wrongly; keep simple defaults
      if (col.default_expr && !col.default_expr.includes("nextval")) {
        d += ` DEFAULT ${col.default_expr}`;
      }
      return d;
    });
    await dst.query(`create table public.${q(table)} (${defs.join(", ")})`);
    console.log("Created public." + table);
  }

  // PK / UNIQUE first, then FK
  const cons = await getConstraints(src);
  for (const c of cons.filter((x) => x.contype === "p" || x.contype === "u")) {
    try {
      await dst.query(
        `alter table public.${q(c.table_name)} add constraint ${q(c.conname)} ${c.def}`
      );
      console.log("  +", c.contype, c.conname);
    } catch (e) {
      console.warn("  constraint fail", c.conname, e.message.split("\n")[0]);
    }
  }
  for (const c of cons.filter((x) => x.contype === "f")) {
    try {
      await dst.query(
        `alter table public.${q(c.table_name)} add constraint ${q(c.conname)} ${c.def}`
      );
      console.log("  + FK", c.conname);
    } catch (e) {
      console.warn("  FK fail", c.conname, e.message.split("\n")[0]);
    }
  }

  const idxs = await getIndexes(src);
  for (const idx of idxs) {
    try {
      // indexdef includes CREATE INDEX ... already
      let def = idx.indexdef;
      // ensure IF NOT EXISTS
      if (!/if not exists/i.test(def)) {
        def = def.replace(/^CREATE (UNIQUE )?INDEX/i, "CREATE $1INDEX IF NOT EXISTS");
      }
      await dst.query(def);
      console.log("  + index", idx.indexname);
    } catch (e) {
      console.warn("  index fail", idx.indexname, e.message.split("\n")[0]);
    }
  }
}

async function copyTableData(src, dst, table, orderBy = "id") {
  const colsR = await src.query(
    `select column_name from information_schema.columns
     where table_schema='public' and table_name=$1 order by ordinal_position`,
    [table]
  );
  const colNames = colsR.rows.map((r) => r.column_name);
  const colList = colNames.map(q).join(", ");
  const count = (await src.query(`select count(*)::int as n from public.${q(table)}`)).rows[0]
    .n;
  await dst.query(`truncate table public.${q(table)} cascade`);
  if (count === 0) {
    console.log(`  data ${table}: 0`);
    return 0;
  }

  const batch = 200;
  let offset = 0;
  let total = 0;
  while (offset < count) {
    const rows = await src.query(
      `select ${colList} from public.${q(table)} order by ${q(orderBy)} nulls last limit ${batch} offset ${offset}`
    );
    if (!rows.rows.length) break;
    for (const row of rows.rows) {
      const vals = colNames.map((c) => row[c]);
      const ph = vals.map((_, i) => `$${i + 1}`).join(", ");
      await dst.query(
        `insert into public.${q(table)} (${colList}) values (${ph})`,
        vals
      );
      total++;
    }
    offset += batch;
  }
  console.log(`  data ${table}: ${total}`);
  return total;
}

async function migrateAuth(src, dst) {
  console.log("\n=== Auth migration (preserve user ids) ===");

  // Columns may differ slightly between Supabase versions — select intersection
  const srcCols = (
    await src.query(`
    select column_name from information_schema.columns
    where table_schema='auth' and table_name='users' order by ordinal_position
  `)
  ).rows.map((r) => r.column_name);
  const dstCols = (
    await dst.query(`
    select column_name from information_schema.columns
    where table_schema='auth' and table_name='users' order by ordinal_position
  `)
  ).rows.map((r) => r.column_name);
  const userCols = srcCols.filter((c) => dstCols.includes(c));
  console.log("auth.users shared columns:", userCols.length);

  const users = await src.query(
    `select ${userCols.map(q).join(", ")} from auth.users order by created_at`
  );
  console.log("Source auth.users:", users.rows.length);

  let inserted = 0;
  let skipped = 0;
  for (const row of users.rows) {
    const existing = await dst.query(`select id, email from auth.users where id = $1 or email = $2`, [
      row.id,
      row.email,
    ]);
    if (existing.rows.length) {
      // if same email different id — keep existing GTR user; will remap app data later if needed
      console.log(
        "  skip user",
        row.email,
        "already on GTR as",
        existing.rows.map((x) => x.id + "/" + x.email).join("; ")
      );
      skipped++;
      continue;
    }
    const vals = userCols.map((c) => row[c]);
    const ph = vals.map((_, i) => `$${i + 1}`).join(", ");
    try {
      await dst.query(
        `insert into auth.users (${userCols.map(q).join(", ")}) values (${ph})`,
        vals
      );
      inserted++;
      console.log("  + user", row.email, row.id);
    } catch (e) {
      console.warn("  fail user", row.email, e.message.split("\n")[0]);
    }
  }

  // identities
  const idSrcCols = (
    await src.query(`
    select column_name from information_schema.columns
    where table_schema='auth' and table_name='identities' order by ordinal_position
  `)
  ).rows.map((r) => r.column_name);
  const idDstCols = (
    await dst.query(`
    select column_name from information_schema.columns
    where table_schema='auth' and table_name='identities' order by ordinal_position
  `)
  ).rows.map((r) => r.column_name);
  const idCols = idSrcCols.filter((c) => idDstCols.includes(c));

  const identities = await src.query(
    `select ${idCols.map(q).join(", ")} from auth.identities order by created_at`
  );
  console.log("Source auth.identities:", identities.rows.length);
  let idIns = 0;
  for (const row of identities.rows) {
    // only if user exists on dest
    const u = await dst.query(`select 1 from auth.users where id = $1`, [row.user_id]);
    if (!u.rows.length) continue;
    const exists = await dst.query(`select 1 from auth.identities where id = $1`, [row.id]);
    if (exists.rows.length) continue;
    const vals = idCols.map((c) => row[c]);
    const ph = vals.map((_, i) => `$${i + 1}`).join(", ");
    try {
      await dst.query(
        `insert into auth.identities (${idCols.map(q).join(", ")}) values (${ph})`,
        vals
      );
      idIns++;
    } catch (e) {
      console.warn("  identity fail", row.id, e.message.split("\n")[0]);
    }
  }
  console.log(`Auth done: users inserted=${inserted} skipped=${skipped} identities=${idIns}`);
  return { users: users.rows, inserted, skipped };
}

async function verify(dst) {
  const r = await dst.query(`
    select
      (select count(*)::int from public."Bottle") as bottles,
      (select count(*)::int from public."Recipe") as recipes,
      (select count(*)::int from public."RecipeIngredient") as ingredients,
      (select count(*)::int from public."ShoppingItem") as shopping
  `);
  const byUser = await dst.query(`
    select b."userId", u.email, count(*)::int as bottles
    from public."Bottle" b
    left join auth.users u on u.id = b."userId"::uuid
    group by 1, 2
    order by bottles desc
  `);
  const pk = await dst.query(`
    select rel.relname, c.conname, c.contype
    from pg_constraint c
    join pg_class rel on rel.oid = c.conrelid
    join pg_namespace n on n.oid = rel.relnamespace
    where n.nspname='public' and rel.relname in ('Bottle','Recipe','RecipeIngredient','ShoppingItem')
    order by 1, 3
  `);
  console.log("\n=== VERIFY GTR-Database ===");
  console.log("counts:", r.rows[0]);
  console.log("bottles per user:");
  byUser.rows.forEach((x) => console.log(" ", x.email || "(no auth)", x.userId, "→", x.bottles));
  console.log("constraints:");
  pk.rows.forEach((x) => console.log(" ", x.relname, x.contype, x.conname));
}

(async () => {
  const t = loadTokens();
  const src = await connect(t.BAR_DATABASE_URL, "BAR source");
  const dst = await connect(
    t.GTR_DB_DIRECT_URL || t.GTR_DB_DATABASE_URL,
    "GTR-Database prod"
  );

  console.log("\n=== 1. Recreate app tables with structure ===");
  await recreateAppTables(src, dst);

  console.log("\n=== 2. Copy data (preserve userId) ===");
  // Recipe first? Bottle independent; Recipe before Ingredient/Shopping
  await copyTableData(src, dst, "Bottle");
  await copyTableData(src, dst, "Recipe");
  await copyTableData(src, dst, "RecipeIngredient");
  await copyTableData(src, dst, "ShoppingItem");

  console.log("\n=== 3. Auth users ===");
  await migrateAuth(src, dst);

  await verify(dst);

  await src.end();
  await dst.end();
  console.log("\nMIGRATION COMPLETE");
})().catch(async (e) => {
  console.error("FAIL:", e);
  process.exit(1);
});
