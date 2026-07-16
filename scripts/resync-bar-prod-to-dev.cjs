/**
 * Resync bar app tables + related Auth users: GTR-Database (prod) → GTR-Database-Dev
 */
const { Client } = require("pg");
const fs = require("fs");

const APP_TABLES = ["Bottle", "Recipe", "RecipeIngredient", "ShoppingItem"];
// Drop order (FK children first)
const DROP_ORDER = ["ShoppingItem", "RecipeIngredient", "Recipe", "Bottle"];
// Insert order
const INSERT_ORDER = ["Bottle", "Recipe", "RecipeIngredient", "ShoppingItem"];

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
    connectionTimeoutMillis: 20000,
  });
  await c.connect();
  console.log("Connected:", label);
  return c;
}

async function recreateTables(src, dst) {
  const colMap = {};
  for (const table of APP_TABLES) {
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
    if (!cols.rows.length) throw new Error("Missing table on prod: " + table);
    colMap[table] = cols.rows;
  }

  for (const table of DROP_ORDER) {
    await dst.query(`drop table if exists public.${q(table)} cascade`);
    console.log("Dropped Dev public." + table);
  }

  for (const table of INSERT_ORDER) {
    const defs = colMap[table].map((col) => {
      let d = `${q(col.column_name)} ${col.data_type}`;
      if (col.not_null) d += " NOT NULL";
      if (col.default_expr && !String(col.default_expr).includes("nextval")) {
        d += ` DEFAULT ${col.default_expr}`;
      }
      return d;
    });
    await dst.query(`create table public.${q(table)} (${defs.join(", ")})`);
    console.log("Created Dev public." + table);
  }

  const cons = await src.query(`
    select c.conname, rel.relname as table_name, c.contype, pg_get_constraintdef(c.oid) as def
    from pg_constraint c
    join pg_class rel on rel.oid = c.conrelid
    join pg_namespace n on n.oid = rel.relnamespace
    where n.nspname = 'public' and rel.relname = any($1::text[])
    order by case c.contype when 'p' then 0 when 'u' then 1 when 'f' then 2 else 3 end, rel.relname
  `, [APP_TABLES]);

  for (const c of cons.rows.filter((x) => x.contype === "p" || x.contype === "u")) {
    try {
      await dst.query(
        `alter table public.${q(c.table_name)} add constraint ${q(c.conname)} ${c.def}`
      );
      console.log("  +", c.contype, c.conname);
    } catch (e) {
      console.warn("  constraint", c.conname, e.message.split("\n")[0]);
    }
  }
  for (const c of cons.rows.filter((x) => x.contype === "f")) {
    try {
      await dst.query(
        `alter table public.${q(c.table_name)} add constraint ${q(c.conname)} ${c.def}`
      );
      console.log("  + FK", c.conname);
    } catch (e) {
      console.warn("  FK", c.conname, e.message.split("\n")[0]);
    }
  }

  const idxs = await src.query(`
    select indexname, indexdef from pg_indexes
    where schemaname = 'public' and tablename = any($1::text[])
      and indexname not like '%_pkey'
  `, [APP_TABLES]);
  for (const idx of idxs.rows) {
    try {
      let def = idx.indexdef;
      if (!/if not exists/i.test(def)) {
        def = def.replace(/^CREATE (UNIQUE )?INDEX/i, "CREATE $1INDEX IF NOT EXISTS");
      }
      await dst.query(def);
      console.log("  + index", idx.indexname);
    } catch (e) {
      console.warn("  index", idx.indexname, e.message.split("\n")[0]);
    }
  }
}

async function copyData(src, dst, table) {
  const colsR = await src.query(
    `select column_name from information_schema.columns
     where table_schema='public' and table_name=$1 order by ordinal_position`,
    [table]
  );
  const colNames = colsR.rows.map((r) => r.column_name);
  const colList = colNames.map(q).join(", ");
  const n = (await src.query(`select count(*)::int as n from public.${q(table)}`)).rows[0].n;
  if (n === 0) {
    console.log(`  data ${table}: 0`);
    return;
  }
  const batch = 200;
  let offset = 0;
  let total = 0;
  while (offset < n) {
    const rows = await src.query(
      `select ${colList} from public.${q(table)} order by ${q(colNames[0])} nulls last limit ${batch} offset ${offset}`
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
}

async function syncAuthUsers(src, dst) {
  console.log("\n=== Auth users (ids used by bar data) ===");
  const needed = await src.query(`
    select distinct "userId" as id from public."Bottle" where "userId" is not null
    union select distinct "userId" from public."Recipe" where "userId" is not null
    union select distinct "userId" from public."ShoppingItem" where "userId" is not null
  `);
  const ids = needed.rows.map((r) => r.id).filter(Boolean);
  console.log("userIds in bar data:", ids.length, ids);

  const srcCols = (
    await src.query(`
    select column_name, is_generated from information_schema.columns
    where table_schema='auth' and table_name='users'
  `)
  ).rows;
  const dstCols = new Set(
    (
      await dst.query(`
      select column_name from information_schema.columns
      where table_schema='auth' and table_name='users'
    `)
    ).rows.map((r) => r.column_name)
  );
  const gen = new Set(
    srcCols.filter((c) => c.is_generated === "ALWAYS").map((c) => c.column_name)
  );
  const skip = new Set(["confirmed_at", "email_confirmed_at", "phone_confirmed_at"]);
  const userCols = srcCols
    .map((c) => c.column_name)
    .filter((c) => dstCols.has(c) && !gen.has(c) && !skip.has(c));

  for (const id of ids) {
    const onDev = await dst.query(`select id, email from auth.users where id = $1`, [id]);
    if (onDev.rows.length) {
      console.log("  auth OK", onDev.rows[0].email, id);
      continue;
    }
    const onProd = await src.query(
      `select ${userCols.map(q).join(", ")} from auth.users where id = $1`,
      [id]
    );
    if (!onProd.rows.length) {
      console.warn("  missing on prod auth:", id);
      continue;
    }
    const row = onProd.rows[0];
    // email collision on Dev?
    const byEmail = await dst.query(
      `select id, email from auth.users where lower(email) = lower($1)`,
      [row.email]
    );
    if (byEmail.rows.length && byEmail.rows[0].id !== id) {
      console.log(
        "  MAP email",
        row.email,
        id,
        "→ Dev existing",
        byEmail.rows[0].id
      );
      // remap data on Dev after copy — store for later
      await dst.query(
        `update public."Bottle" set "userId" = $1 where "userId" = $2`,
        [byEmail.rows[0].id, id]
      ).catch(() => {});
      await dst.query(
        `update public."Recipe" set "userId" = $1 where "userId" = $2`,
        [byEmail.rows[0].id, id]
      ).catch(() => {});
      await dst.query(
        `update public."ShoppingItem" set "userId" = $1 where "userId" = $2`,
        [byEmail.rows[0].id, id]
      ).catch(() => {});
      continue;
    }
    const vals = userCols.map((c) => row[c]);
    const ph = vals.map((_, i) => `$${i + 1}`).join(", ");
    try {
      await dst.query(
        `insert into auth.users (${userCols.map(q).join(", ")}) values (${ph})`,
        vals
      );
      console.log("  + auth.users", row.email, id);
    } catch (e) {
      console.warn("  insert user fail", row.email, e.message.split("\n")[0]);
    }
  }

  // identities for those users
  const idSrcCols = (
    await src.query(`
    select column_name, is_generated from information_schema.columns
    where table_schema='auth' and table_name='identities'
  `)
  ).rows;
  const idDst = new Set(
    (
      await dst.query(`
      select column_name from information_schema.columns
      where table_schema='auth' and table_name='identities'
    `)
    ).rows.map((r) => r.column_name)
  );
  const idGen = new Set(
    idSrcCols.filter((c) => c.is_generated === "ALWAYS").map((c) => c.column_name)
  );
  const idCols = idSrcCols
    .map((c) => c.column_name)
    .filter((c) => idDst.has(c) && !idGen.has(c));

  for (const id of ids) {
    const idsRows = await src.query(
      `select ${idCols.map(q).join(", ")} from auth.identities where user_id = $1`,
      [id]
    );
    for (const row of idsRows.rows) {
      const u = await dst.query(`select 1 from auth.users where id = $1`, [row.user_id]);
      if (!u.rows.length) continue;
      const exists = await dst.query(
        `select 1 from auth.identities where provider = $1 and provider_id = $2`,
        [row.provider, row.provider_id]
      );
      if (exists.rows.length) continue;
      const vals = idCols.map((c) => row[c]);
      const ph = vals.map((_, i) => `$${i + 1}`).join(", ");
      try {
        await dst.query(
          `insert into auth.identities (${idCols.map(q).join(", ")}) values (${ph})`,
          vals
        );
        console.log("  + identity", row.provider, row.user_id);
      } catch (e) {
        console.warn("  identity", e.message.split("\n")[0]);
      }
    }
  }
}

async function verify(src, dst) {
  console.log("\n=== VERIFY ===");
  for (const table of APP_TABLES) {
    const a = (await src.query(`select count(*)::int n from public.${q(table)}`)).rows[0].n;
    const b = (await dst.query(`select count(*)::int n from public.${q(table)}`)).rows[0].n;
    console.log(`${table}: prod=${a} dev=${b}${a === b ? " OK" : " MISMATCH"}`);
  }
  const byUser = await dst.query(`
    select b."userId", u.email, count(*)::int as bottles
    from public."Bottle" b
    left join auth.users u on u.id::text = b."userId"
    group by 1, 2
    order by bottles desc
  `);
  console.log("Dev bottles per user:");
  byUser.rows.forEach((r) =>
    console.log(" ", r.email || "NO AUTH", r.userId, r.bottles)
  );
}

(async () => {
  const t = loadTokens();
  const src = await connect(
    t.GTR_DB_DIRECT_URL || t.GTR_DB_DATABASE_URL,
    "GTR-Database PROD"
  );
  const dst = await connect(
    t.GTR_DB_DEV_DIRECT_URL || t.GTR_DB_DEV_DATABASE_URL,
    "GTR-Database-Dev"
  );

  console.log("\n=== 1. Structure ===");
  await recreateTables(src, dst);

  console.log("\n=== 2. Data ===");
  for (const table of INSERT_ORDER) {
    await copyData(src, dst, table);
  }

  console.log("\n=== 3. Auth ===");
  await syncAuthUsers(src, dst);

  await verify(src, dst);
  await src.end();
  await dst.end();
  console.log("\nRESYNC BAR PROD → DEV COMPLETE");
})().catch((e) => {
  console.error("FAIL:", e);
  process.exit(1);
});
