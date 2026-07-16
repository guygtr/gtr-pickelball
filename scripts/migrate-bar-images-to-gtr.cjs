/**
 * Migrate bottle images from bar-personnel-manager Storage → GTR-Database prod.
 * 1) Ensure public bucket bottles_images on GTR
 * 2) Download each Bottle.imageUrl from BAR (or list), upload to GTR
 * 3) Rewrite public.Bottle.imageUrl (+ Recipe if any)
 *
 * Usage: node scripts/migrate-bar-images-to-gtr.cjs
 */
const { Client } = require("pg");
const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");
const https = require("https");
const http = require("http");

const BUCKET = "bottles_images";
const LOCAL_DIR = "D:/GrokBuild/Backups/storage/bar-bottles-images";

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

function fetchBuffer(url) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith("https") ? https : http;
    const req = lib.get(url, { timeout: 30000 }, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        res.resume();
        fetchBuffer(res.headers.location).then(resolve, reject);
        return;
      }
      if (!res.statusCode || res.statusCode >= 400) {
        reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        res.resume();
        return;
      }
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => resolve(Buffer.concat(chunks)));
    });
    req.on("error", reject);
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("timeout " + url));
    });
  });
}

function pathFromPublicUrl(url, supabaseUrl) {
  // https://xxx.supabase.co/storage/v1/object/public/bottles_images/public/file.jpg
  const marker = `/object/public/${BUCKET}/`;
  const i = url.indexOf(marker);
  if (i >= 0) return url.slice(i + marker.length);
  // fallback: last two segments
  try {
    const u = new URL(url);
    const parts = u.pathname.split("/").filter(Boolean);
    const idx = parts.indexOf(BUCKET);
    if (idx >= 0) return parts.slice(idx + 1).join("/");
  } catch {
    /* ignore */
  }
  return null;
}

function contentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  if (ext === ".gif") return "image/gif";
  return "image/jpeg";
}

async function ensureBucket(gtr) {
  const { data: buckets, error } = await gtr.storage.listBuckets();
  if (error) throw error;
  if (buckets.some((b) => b.name === BUCKET)) {
    console.log("Bucket already exists:", BUCKET);
    return;
  }
  const { error: createErr } = await gtr.storage.createBucket(BUCKET, {
    public: true,
    fileSizeLimit: 10 * 1024 * 1024,
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  });
  if (createErr) throw createErr;
  console.log("Created public bucket:", BUCKET);
}

async function downloadViaApi(bar, objectPath) {
  const { data, error } = await bar.storage.from(BUCKET).download(objectPath);
  if (error) throw error;
  const ab = await data.arrayBuffer();
  return Buffer.from(ab);
}

(async () => {
  const t = loadTokens();
  if (!t.BAR_SUPABASE_URL || !t.BAR_SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Missing BAR_* tokens");
  }
  if (!t.GTR_DB_SUPABASE_URL || !t.GTR_DB_SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Missing GTR_DB_* tokens");
  }

  const bar = createClient(t.BAR_SUPABASE_URL, t.BAR_SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const gtr = createClient(t.GTR_DB_SUPABASE_URL, t.GTR_DB_SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  fs.mkdirSync(LOCAL_DIR, { recursive: true });
  await ensureBucket(gtr);

  const c = new Client({
    connectionString: t.GTR_DB_DIRECT_URL || t.GTR_DB_DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  await c.connect();

  const bottles = (
    await c.query(`
      select id, name, "imageUrl"
      from public."Bottle"
      where "imageUrl" is not null and "imageUrl" <> ''
      order by name
    `)
  ).rows;

  console.log("Bottles with imageUrl:", bottles.length);

  let ok = 0;
  let fail = 0;
  const cache = new Map(); // objectPath -> new public URL

  for (const row of bottles) {
    const oldUrl = row.imageUrl;
    let objectPath = pathFromPublicUrl(oldUrl, t.BAR_SUPABASE_URL);
    if (!objectPath) {
      console.error("FAIL path parse:", row.name, oldUrl);
      fail++;
      continue;
    }

    try {
      let newUrl = cache.get(objectPath);
      if (!newUrl) {
        // download from BAR (API first, public URL fallback)
        let buf;
        try {
          buf = await downloadViaApi(bar, objectPath);
        } catch (e1) {
          console.log("  API download fail, try HTTP:", objectPath, e1.message);
          buf = await fetchBuffer(oldUrl);
        }

        const localFile = path.join(LOCAL_DIR, objectPath.replace(/\//g, "__"));
        fs.mkdirSync(path.dirname(localFile), { recursive: true });
        fs.writeFileSync(localFile, buf);

        const { error: upErr } = await gtr.storage.from(BUCKET).upload(objectPath, buf, {
          contentType: contentType(objectPath),
          cacheControl: "3600",
          upsert: true,
        });
        if (upErr) throw upErr;

        const { data: pub } = gtr.storage.from(BUCKET).getPublicUrl(objectPath);
        newUrl = pub.publicUrl;
        cache.set(objectPath, newUrl);
        console.log("OK upload", objectPath, `(${buf.length} bytes)`);
      }

      await c.query(`update public."Bottle" set "imageUrl" = $1, "updatedAt" = now() where id = $2`, [
        newUrl,
        row.id,
      ]);
      ok++;
      console.log(`  linked ${row.name} → GTR`);
    } catch (e) {
      fail++;
      console.error("FAIL", row.name, objectPath, e.message || e);
    }
  }

  // Recipes with images (if any)
  const recipes = (
    await c.query(`
      select id, name, "imageUrl"
      from public."Recipe"
      where "imageUrl" is not null and "imageUrl" <> ''
    `)
  ).rows;
  for (const row of recipes) {
    const objectPath = pathFromPublicUrl(row.imageUrl, t.BAR_SUPABASE_URL);
    if (!objectPath) continue;
    try {
      let newUrl = cache.get(objectPath);
      if (!newUrl) {
        const buf = await downloadViaApi(bar, objectPath).catch(() => fetchBuffer(row.imageUrl));
        await gtr.storage.from(BUCKET).upload(objectPath, buf, {
          contentType: contentType(objectPath),
          upsert: true,
        });
        newUrl = gtr.storage.from(BUCKET).getPublicUrl(objectPath).data.publicUrl;
        cache.set(objectPath, newUrl);
      }
      await c.query(`update public."Recipe" set "imageUrl" = $1, "updatedAt" = now() where id = $2`, [
        newUrl,
        row.id,
      ]);
      console.log("Recipe linked:", row.name);
    } catch (e) {
      console.error("Recipe FAIL", row.name, e.message);
    }
  }

  // Summary hosts
  const summary = await c.query(`
    select
      count(*) filter (where "imageUrl" like '%ncsxtgdnwjxoprtccggk%') as gtr_urls,
      count(*) filter (where "imageUrl" like '%gyeofcfjgpthwsirjcya%') as old_urls,
      count(*) filter (where "imageUrl" is not null and "imageUrl" <> '') as with_img,
      count(*) as total
    from public."Bottle"
  `);
  console.log("\n=== SUMMARY ===");
  console.log("migrated ok:", ok, "fail:", fail);
  console.log("local cache:", LOCAL_DIR);
  console.log("Bottle URL hosts:", summary.rows[0]);

  // HEAD check 3 samples
  const samples = (
    await c.query(`
      select name, "imageUrl" from public."Bottle"
      where "imageUrl" like '%ncsxtgdnwjxoprtccggk%'
      limit 3
    `)
  ).rows;
  for (const s of samples) {
    try {
      const buf = await fetchBuffer(s.imageUrl);
      console.log("HEAD/GET ok:", s.name, buf.length, "bytes");
    } catch (e) {
      console.log("GET fail:", s.name, e.message);
    }
  }

  await c.end();
  console.log("DONE");
})().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
