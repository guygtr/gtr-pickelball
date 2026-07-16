/**
 * Fix Auth migration after structure migrate:
 * 1) Insert missing BAR users into GTR auth (no generated cols)
 * 2) Remap app userIds by email when BAR id ≠ GTR id
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

async function connect(url) {
  const c = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  await c.connect();
  return c;
}

// Columns that are often generated / must not be inserted
const SKIP_USER_COLS = new Set([
  "confirmed_at",
  "email_confirmed_at", // sometimes writable
  "phone_confirmed_at",
]);

(async () => {
  const t = loadTokens();
  const src = await connect(t.BAR_DATABASE_URL);
  const dst = await connect(t.GTR_DB_DIRECT_URL || t.GTR_DB_DATABASE_URL);

  const srcCols = (
    await src.query(`
    select column_name, is_generated, generation_expression
    from information_schema.columns
    where table_schema='auth' and table_name='users'
  `)
  ).rows;
  const dstCols = (
    await dst.query(`
    select column_name, is_generated
    from information_schema.columns
    where table_schema='auth' and table_name='users'
  `)
  ).rows;
  const dstSet = new Set(dstCols.map((c) => c.column_name));
  const generated = new Set(
    [...srcCols, ...dstCols]
      .filter((c) => c.is_generated === "ALWAYS")
      .map((c) => c.column_name)
  );

  const userCols = srcCols
    .map((c) => c.column_name)
    .filter((c) => dstSet.has(c) && !generated.has(c) && !SKIP_USER_COLS.has(c));

  console.log("Insertable auth.users columns:", userCols.join(", "));

  const barUsers = await src.query(
    `select ${userCols.map(q).join(", ")} from auth.users order by created_at`
  );
  console.log("BAR users:", barUsers.rows.length);

  /** @type {Map<string,string>} barId -> gtrId */
  const idMap = new Map();

  for (const row of barUsers.rows) {
    const byId = await dst.query(`select id, email from auth.users where id = $1`, [row.id]);
    const byEmail = await dst.query(`select id, email from auth.users where lower(email) = lower($1)`, [
      row.email,
    ]);

    if (byId.rows.length) {
      idMap.set(row.id, row.id);
      console.log("OK same id", row.email, row.id);
      continue;
    }

    if (byEmail.rows.length) {
      // Same email, different id on GTR — keep GTR id, remap data later
      idMap.set(row.id, byEmail.rows[0].id);
      console.log("MAP email", row.email, row.id, "→", byEmail.rows[0].id);
      continue;
    }

    // Insert with original id
    const vals = userCols.map((c) => row[c]);
    const ph = vals.map((_, i) => `$${i + 1}`).join(", ");
    try {
      await dst.query(
        `insert into auth.users (${userCols.map(q).join(", ")}) values (${ph})`,
        vals
      );
      idMap.set(row.id, row.id);
      console.log("INSERTED", row.email, row.id);
    } catch (e) {
      console.warn("INSERT fail", row.email, e.message.split("\n")[0]);
    }
  }

  // identities
  const idSrcCols = (
    await src.query(`
    select column_name, is_generated from information_schema.columns
    where table_schema='auth' and table_name='identities'
  `)
  ).rows;
  const idDstCols = new Set(
    (
      await dst.query(`
      select column_name from information_schema.columns
      where table_schema='auth' and table_name='identities'
    `)
    ).rows.map((r) => r.column_name)
  );
  const idGen = new Set(idSrcCols.filter((c) => c.is_generated === "ALWAYS").map((c) => c.column_name));
  const idCols = idSrcCols
    .map((c) => c.column_name)
    .filter((c) => idDstCols.has(c) && !idGen.has(c));

  const identities = await src.query(
    `select ${idCols.map(q).join(", ")} from auth.identities`
  );
  for (const row of identities.rows) {
    const mappedUser = idMap.get(row.user_id) || row.user_id;
    const u = await dst.query(`select 1 from auth.users where id = $1`, [mappedUser]);
    if (!u.rows.length) continue;
    const exists = await dst.query(
      `select 1 from auth.identities where provider = $1 and provider_id = $2`,
      [row.provider, row.provider_id]
    );
    if (exists.rows.length) continue;

    // rewrite user_id if remapped
    const rowCopy = { ...row, user_id: mappedUser };
    // if id is uuid of identity and conflicts, generate skip
    const vals = idCols.map((c) => rowCopy[c]);
    const ph = vals.map((_, i) => `$${i + 1}`).join(", ");
    try {
      await dst.query(
        `insert into auth.identities (${idCols.map(q).join(", ")}) values (${ph})`,
        vals
      );
      console.log("  + identity", row.provider, mappedUser);
    } catch (e) {
      // try without id if present
      console.warn("  identity fail", e.message.split("\n")[0]);
    }
  }

  // Remap app tables for id changes
  console.log("\n=== Remap app userIds where BAR id ≠ GTR id ===");
  let remapCount = 0;
  for (const [fromId, toId] of idMap.entries()) {
    if (fromId === toId) continue;
    for (const table of ["Bottle", "Recipe", "ShoppingItem"]) {
      const r = await dst.query(
        `update public.${q(table)} set "userId" = $1 where "userId" = $2`,
        [toId, fromId]
      );
      if (r.rowCount) {
        console.log(`  ${table}: ${fromId.slice(0, 8)}… → ${toId.slice(0, 8)}… (${r.rowCount})`);
        remapCount += r.rowCount;
      }
    }
  }
  console.log("Total remapped rows:", remapCount);

  // Verify
  const byUser = await dst.query(`
    select b."userId", u.email, count(*)::int as bottles
    from public."Bottle" b
    left join auth.users u on u.id::text = b."userId"
    group by 1, 2
    order by bottles desc
  `);
  console.log("\nBottles per user (with email):");
  byUser.rows.forEach((x) => console.log(" ", x.email || "NO AUTH", x.userId, x.bottles));

  // Source vs dest counts
  const srcC = await src.query(`select count(*)::int n from public."Bottle"`);
  const dstC = await dst.query(`select count(*)::int n from public."Bottle"`);
  console.log("\nBottle count source=", srcC.rows[0].n, "dest=", dstC.rows[0].n);

  await src.end();
  await dst.end();
  console.log("DONE");
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
