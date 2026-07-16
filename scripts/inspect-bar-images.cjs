/**
 * Inspect Bottle/Recipe imageUrl hosts on GTR prod + backup export.
 */
const { Client } = require("pg");
const fs = require("fs");
const path = require("path");
const https = require("https");
const http = require("http");

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

function hostOf(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return "(invalid)";
  }
}

function head(url) {
  return new Promise((resolve) => {
    const lib = url.startsWith("https") ? https : http;
    const req = lib.request(url, { method: "HEAD", timeout: 8000 }, (res) => {
      resolve({ status: res.statusCode, ok: (res.statusCode || 0) < 400 });
      res.resume();
    });
    req.on("error", (e) => resolve({ status: 0, ok: false, err: e.message }));
    req.on("timeout", () => {
      req.destroy();
      resolve({ status: 0, ok: false, err: "timeout" });
    });
    req.end();
  });
}

(async () => {
  const t = loadTokens();
  const c = new Client({
    connectionString: t.GTR_DB_DIRECT_URL || t.GTR_DB_DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  await c.connect();

  const bottles = await c.query(`
    select id, name, "imageUrl"
    from public."Bottle"
    order by name
  `);
  console.log("=== GTR prod Bottles ===");
  console.log("total:", bottles.rows.length);
  const withImg = bottles.rows.filter((r) => r.imageUrl);
  console.log("with imageUrl:", withImg.length);

  const byHost = {};
  for (const r of withImg) {
    const h = hostOf(r.imageUrl);
    byHost[h] = (byHost[h] || 0) + 1;
  }
  console.log("by host:", byHost);

  // sample 3 HEAD checks
  console.log("\n=== HEAD sample (first 5 with URL) ===");
  for (const r of withImg.slice(0, 5)) {
    const h = await head(r.imageUrl);
    console.log(r.name, "→", h);
  }

  // backup
  const backupPath = "D:/GrokBuild/Backups/db/bar-prod-export/Bottle.json";
  if (fs.existsSync(backupPath)) {
    const bak = JSON.parse(fs.readFileSync(backupPath, "utf8"));
    const bakImg = bak.filter((b) => b.imageUrl);
    console.log("\n=== Backup Bottle.json ===");
    console.log("total:", bak.length, "with imageUrl:", bakImg.length);
    const bh = {};
    for (const r of bakImg) {
      const h = hostOf(r.imageUrl);
      bh[h] = (bh[h] || 0) + 1;
    }
    console.log("by host:", bh);
  }

  // GTR storage buckets via storage schema if present
  try {
    const buckets = await c.query(
      `select id, name, public from storage.buckets order by name`
    );
    console.log("\n=== GTR storage.buckets ===");
    buckets.rows.forEach((b) => console.log(" ", b.id, b.name, "public=" + b.public));
    const objs = await c.query(
      `select bucket_id, count(*)::int as n from storage.objects group by 1 order by 1`
    );
    console.log("objects:");
    objs.rows.forEach((o) => console.log(" ", o.bucket_id, o.n));
  } catch (e) {
    console.log("\nstorage schema:", e.message);
  }

  // tokens for old BAR
  console.log("\n=== Token presence ===");
  console.log("BAR_SUPABASE_URL:", t.BAR_SUPABASE_URL || "(missing)");
  console.log("GTR_DB_SUPABASE_URL:", t.GTR_DB_SUPABASE_URL || "(missing)");

  await c.end();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
