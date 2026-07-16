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

function redact(url) {
  if (!url) return "(missing)";
  return url.replace(/:\/\/([^:]+):([^@]+)@/, "://$1:***@");
}

async function test(name, url) {
  console.log("\n" + name + ":");
  console.log("  form:", redact(url));
  if (!url) {
    console.log("  status: MISSING");
    return false;
  }
  if (/XXXX|YOUR_|changeme|password/i.test(url) && !url.includes("supabase")) {
    console.log("  status: LOOKS LIKE PLACEHOLDER");
  }
  if (url.includes("XXXX")) {
    console.log("  status: PLACEHOLDER (XXXX)");
    return false;
  }
  const c = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  try {
    await c.connect();
    const r = await c.query("select current_database() as db, current_user as usr");
    console.log("  status: OK", r.rows[0]);
    await c.end();
    return true;
  } catch (e) {
    console.log("  status: FAIL", e.message.split("\n")[0]);
    return false;
  }
}

function describeKeys(t) {
  const need = [
    "GTR_DB_DEV_SUPABASE_URL",
    "GTR_DB_DEV_SUPABASE_ANON_KEY",
    "GTR_DB_DEV_SUPABASE_SERVICE_ROLE_KEY",
    "GTR_DB_DEV_DATABASE_PASSWORD",
    "GTR_DB_DEV_DATABASE_URL",
    "GTR_DB_DEV_DIRECT_URL",
  ];
  console.log("GTR_DB_DEV keys:");
  for (const k of need) {
    const v = t[k];
    if (!v) console.log("  [ ]", k, "MISSING");
    else console.log("  [x]", k, "len=" + v.length);
  }
  const ref = (t.GTR_DB_DEV_SUPABASE_URL || "").match(/https:\/\/([a-z0-9]+)\.supabase\.co/);
  console.log("  project ref:", ref ? ref[1] : "(unknown)");
}

(async () => {
  const t = loadTokens();
  describeKeys(t);
  const okDevDb = await test("GTR_DB_DEV_DATABASE_URL", t.GTR_DB_DEV_DATABASE_URL);
  const okDevDirect = await test("GTR_DB_DEV_DIRECT_URL", t.GTR_DB_DEV_DIRECT_URL);
  const okProd = await test("GTR_DB_DATABASE_URL (prod)", t.GTR_DB_DATABASE_URL);

  console.log("\n=== SUMMARY ===");
  console.log("Dev pooler URL:", okDevDb ? "OK" : "NEED FIX");
  console.log("Dev direct URL:", okDevDirect ? "OK" : "NEED FIX");
  console.log("Prod URL:", okProd ? "OK" : "NEED FIX");

  // Suggest DATABASE_URL if missing/broken but we have password + ref
  const ref = (t.GTR_DB_DEV_SUPABASE_URL || "").match(/https:\/\/([a-z0-9]+)\.supabase\.co/);
  const pwd = t.GTR_DB_DEV_DATABASE_PASSWORD;
  if (ref && pwd && !okDevDb) {
    const r = ref[1];
    console.log("\nSuggested GTR_DB_DEV_DATABASE_URL (Transaction pooler :6543):");
    console.log(
      `postgresql://postgres.${r}:[PASSWORD]@aws-1-ca-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true`
    );
    console.log("Suggested GTR_DB_DEV_DIRECT_URL (Session :5432):");
    console.log(
      `postgresql://postgres.${r}:[PASSWORD]@aws-1-ca-central-1.pooler.supabase.com:5432/postgres`
    );
    console.log("\nOr copy URI from Dashboard → Project Settings → Database → Connect → URI");
    console.log("  Mode 'Transaction' → DATABASE_URL");
    console.log("  Mode 'Session'     → DIRECT_URL");
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
