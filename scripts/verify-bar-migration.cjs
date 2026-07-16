const { Client } = require("pg");
const fs = require("fs");

function load() {
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
  const t = load();
  const c = new Client({
    connectionString: t.GTR_DB_DIRECT_URL || t.GTR_DB_DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  const src = new Client({
    connectionString: t.BAR_DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  await c.connect();
  await src.connect();
  for (const table of ["Bottle", "Recipe", "RecipeIngredient", "ShoppingItem"]) {
    const a = (await src.query(`select count(*)::int n from public."${table}"`)).rows[0].n;
    const b = (await c.query(`select count(*)::int n from public."${table}"`)).rows[0].n;
    console.log(`${table}: source=${a} gtr=${b}${a === b ? " OK" : " MISMATCH"}`);
  }
  const cons = await c.query(`
    select rel.relname, c.contype, c.conname
    from pg_constraint c
    join pg_class rel on rel.oid = c.conrelid
    join pg_namespace n on n.oid = rel.relnamespace
    where n.nspname='public'
      and rel.relname in ('Bottle','Recipe','RecipeIngredient','ShoppingItem')
    order by 1, 2
  `);
  console.log("Constraints:");
  cons.rows.forEach((r) => console.log(" ", r.relname, r.contype, r.conname));
  const users = await c.query(`
    select u.email, count(b.*)::int as bottles
    from auth.users u
    left join public."Bottle" b on b."userId" = u.id::text
    where u.email in (
      select email from auth.users
    )
    group by u.email
    having count(b.*) > 0
    order by bottles desc
  `);
  console.log("Bottles linked to Auth:");
  users.rows.forEach((r) => console.log(" ", r.email, r.bottles));
  await c.end();
  await src.end();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
