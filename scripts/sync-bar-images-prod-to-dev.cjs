/**
 * Sync bottles_images Storage + rewrite imageUrl: GTR-Database prod → Dev
 * Sources: GTR prod storage (preferred) or local backup.
 */
const { Client } = require("pg");
const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

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

function contentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  if (ext === ".gif") return "image/gif";
  return "image/jpeg";
}

function pathFromUrl(url) {
  const marker = `/object/public/${BUCKET}/`;
  const i = url.indexOf(marker);
  if (i >= 0) return url.slice(i + marker.length);
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

async function ensureBucket(client) {
  const { data: buckets, error } = await client.storage.listBuckets();
  if (error) throw error;
  if (buckets.some((b) => b.name === BUCKET)) {
    console.log("Bucket exists on target:", BUCKET);
    return;
  }
  const { error: createErr } = await client.storage.createBucket(BUCKET, {
    public: true,
    fileSizeLimit: 10 * 1024 * 1024,
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  });
  if (createErr) throw createErr;
  console.log("Created public bucket on Dev:", BUCKET);
}

async function listAll(prod, prefix = "public") {
  const out = [];
  let offset = 0;
  const limit = 100;
  for (;;) {
    const { data, error } = await prod.storage.from(BUCKET).list(prefix, {
      limit,
      offset,
      sortBy: { column: "name", order: "asc" },
    });
    if (error) throw error;
    if (!data?.length) break;
    for (const f of data) {
      if (f.id || f.metadata) {
        out.push(prefix ? `${prefix}/${f.name}` : f.name);
      }
    }
    if (data.length < limit) break;
    offset += limit;
  }
  return out;
}

(async () => {
  const t = loadTokens();
  const prod = createClient(t.GTR_DB_SUPABASE_URL, t.GTR_DB_SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const dev = createClient(t.GTR_DB_DEV_SUPABASE_URL, t.GTR_DB_DEV_SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  await ensureBucket(dev);

  // Collect object paths from DB imageUrls + storage list + local backup
  const paths = new Set();

  const cProd = new Client({
    connectionString: t.GTR_DB_DIRECT_URL || t.GTR_DB_DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  await cProd.connect();
  const urls = await cProd.query(`
    select "imageUrl" from public."Bottle" where "imageUrl" is not null and "imageUrl" <> ''
    union
    select "imageUrl" from public."Recipe" where "imageUrl" is not null and "imageUrl" <> ''
  `);
  for (const r of urls.rows) {
    const p = pathFromUrl(r.imageUrl);
    if (p) paths.add(p);
  }
  await cProd.end();

  try {
    const listed = await listAll(prod, "public");
    listed.forEach((p) => paths.add(p));
    console.log("Prod storage objects under public/:", listed.length);
  } catch (e) {
    console.warn("Prod list storage:", e.message);
  }

  if (fs.existsSync(LOCAL_DIR)) {
    for (const name of fs.readdirSync(LOCAL_DIR)) {
      // local files named public__file.jpg
      if (name.startsWith("public__")) {
        paths.add("public/" + name.slice("public__".length));
      }
    }
  }

  console.log("Unique image paths to sync:", paths.size);

  let ok = 0;
  let fail = 0;
  for (const objectPath of paths) {
    try {
      let buf;
      try {
        const { data, error } = await prod.storage.from(BUCKET).download(objectPath);
        if (error) throw error;
        buf = Buffer.from(await data.arrayBuffer());
      } catch (e1) {
        const localName = objectPath.replace(/\//g, "__");
        const localFile = path.join(LOCAL_DIR, localName);
        if (!fs.existsSync(localFile)) throw e1;
        buf = fs.readFileSync(localFile);
        console.log("  local fallback:", objectPath);
      }

      const { error: upErr } = await dev.storage.from(BUCKET).upload(objectPath, buf, {
        contentType: contentType(objectPath),
        cacheControl: "3600",
        upsert: true,
      });
      if (upErr) throw upErr;
      ok++;
      console.log("OK", objectPath, buf.length);
    } catch (e) {
      fail++;
      console.error("FAIL", objectPath, e.message || e);
    }
  }

  // Rewrite Dev URLs → Dev host
  const cDev = new Client({
    connectionString: t.GTR_DB_DEV_DIRECT_URL || t.GTR_DB_DEV_DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  await cDev.connect();

  const prodHost = new URL(t.GTR_DB_SUPABASE_URL).hostname;
  const devHost = new URL(t.GTR_DB_DEV_SUPABASE_URL).hostname;
  const oldBarHost = "gyeofcfjgpthwsirjcya.supabase.co";

  for (const table of ["Bottle", "Recipe"]) {
    const r = await cDev.query(
      `
      update public.${JSON.stringify(table).slice(1, -1) === table ? `"${table}"` : `"${table}"`}
      set "imageUrl" = replace(replace("imageUrl", $1, $2), $3, $2),
          "updatedAt" = now()
      where "imageUrl" is not null
        and ("imageUrl" like '%' || $1 || '%' or "imageUrl" like '%' || $3 || '%')
      `,
      [prodHost, devHost, oldBarHost]
    ).catch(async () => {
      // explicit quoted table
      return cDev.query(
        `update public."${table}"
         set "imageUrl" = replace(replace(coalesce("imageUrl",''), $1, $2), $3, $2),
             "updatedAt" = now()
         where "imageUrl" is not null
           and ("imageUrl" like '%' || $1 || '%' or "imageUrl" like '%' || $3 || '%')`,
        [prodHost, devHost, oldBarHost]
      );
    });
    console.log(`Rewrote ${table} imageUrl rows:`, r.rowCount);
  }

  // Ensure any remaining URLs that are path-only get full public URL via re-derive
  const bottles = await cDev.query(`
    select id, name, "imageUrl" from public."Bottle"
    where "imageUrl" is not null and "imageUrl" <> ''
  `);
  let fixed = 0;
  for (const row of bottles.rows) {
    const p = pathFromUrl(row.imageUrl);
    if (!p) continue;
    const { data: pub } = dev.storage.from(BUCKET).getPublicUrl(p);
    if (pub.publicUrl && pub.publicUrl !== row.imageUrl) {
      await cDev.query(`update public."Bottle" set "imageUrl" = $1, "updatedAt" = now() where id = $2`, [
        pub.publicUrl,
        row.id,
      ]);
      fixed++;
    }
  }
  console.log("Normalized Bottle URLs to Dev public:", fixed);

  const sum = await cDev.query(`
    select
      count(*) filter (where "imageUrl" like '%' || $1 || '%') as dev_urls,
      count(*) filter (where "imageUrl" like '%' || $2 || '%') as prod_urls,
      count(*) filter (where "imageUrl" like '%gyeofcfjgpthwsirjcya%') as old_urls,
      count(*) filter (where "imageUrl" is not null and "imageUrl" <> '') as with_img,
      count(*) as total
    from public."Bottle"
  `, [devHost, prodHost]);
  console.log("\n=== Dev Bottle image hosts ===", sum.rows[0]);
  console.log("Upload ok:", ok, "fail:", fail);

  // Sample GET
  const sample = (
    await cDev.query(`
      select name, "imageUrl" from public."Bottle"
      where "imageUrl" like '%' || $1 || '%'
      limit 2
    `, [devHost])
  ).rows;
  for (const s of sample) {
    try {
      const res = await fetch(s.imageUrl);
      console.log("GET", s.name, res.status, res.headers.get("content-type"));
    } catch (e) {
      console.log("GET fail", s.name, e.message);
    }
  }

  await cDev.end();
  console.log("DONE");
})().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
