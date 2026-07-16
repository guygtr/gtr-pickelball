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
    connectionString: t.GTR_DB_DEV_DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  await c.connect();
  const pb = await c.query(`
    select
      (select count(*)::int from pb.pb_leagues) as leagues,
      (select count(*)::int from pb.pb_players) as players,
      (select count(*)::int from pb.pb_matches) as matches,
      (select count(*)::int from pb.pb_sessions) as sessions
  `);
  console.log("Dev pb:", pb.rows[0]);
  const bar = await c.query(`
    select
      (select count(*)::int from public."Bottle") as bottles,
      (select count(*)::int from public."Recipe") as recipes
  `);
  console.log("Dev bar public:", bar.rows[0]);
  await c.end();
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
