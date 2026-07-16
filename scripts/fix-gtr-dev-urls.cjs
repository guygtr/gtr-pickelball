/**
 * Fix GTR_DB_DEV_DATABASE_URL / DIRECT_URL in gtr-tokens.env
 * from SUPABASE_URL ref + DATABASE_PASSWORD (URL-encoded).
 */
const fs = require("fs");

const TOKENS = "D:/GrokBuild/.tokens/gtr-tokens.env";

function loadLines() {
  return fs.readFileSync(TOKENS, "utf8").split(/\r?\n/);
}

function parseMap(lines) {
  const t = {};
  for (const line of lines) {
    const s = line.trim();
    if (!s || s.startsWith("#")) continue;
    const i = s.indexOf("=");
    if (i < 1) continue;
    t[s.slice(0, i).trim()] = s.slice(i + 1).trim().replace(/^["']|["']$/g, "");
  }
  return t;
}

function setOrReplace(lines, key, value) {
  const prefix = key + "=";
  let found = false;
  const out = lines.map((line) => {
    const trimmed = line.trim();
    // skip comments
    if (trimmed.startsWith("#")) return line;
    if (trimmed.startsWith(prefix) || trimmed.startsWith("# " + prefix) || trimmed.startsWith("#" + prefix)) {
      found = true;
      return `${key}="${value}"`;
    }
    return line;
  });
  if (!found) {
    out.push(`${key}="${value}"`);
  }
  return out;
}

const lines = loadLines();
const t = parseMap(lines);

const url = t.GTR_DB_DEV_SUPABASE_URL || "";
const m = url.match(/https:\/\/([a-z0-9]+)\.supabase\.co/i);
if (!m) {
  console.error("Cannot parse project ref from GTR_DB_DEV_SUPABASE_URL");
  process.exit(1);
}
const ref = m[1];
const pwd = t.GTR_DB_DEV_DATABASE_PASSWORD;
if (!pwd) {
  console.error("Missing GTR_DB_DEV_DATABASE_PASSWORD");
  process.exit(1);
}

const enc = encodeURIComponent(pwd);
// Prefer same region style as DIRECT if present, else ca-central-1
let regionHost = "aws-0-ca-central-1.pooler.supabase.com";
const directExisting = t.GTR_DB_DEV_DIRECT_URL || "";
const reg = directExisting.match(/@(aws-\d+-[a-z0-9-]+)\.pooler\.supabase\.com/);
if (reg) regionHost = reg[1] + ".pooler.supabase.com";

const databaseUrl = `postgresql://postgres.${ref}:${enc}@${regionHost}:6543/postgres?pgbouncer=true`;
const directUrl = `postgresql://postgres.${ref}:${enc}@${regionHost}:5432/postgres`;

let next = setOrReplace(lines, "GTR_DB_DEV_DATABASE_URL", databaseUrl);
next = setOrReplace(next, "GTR_DB_DEV_DIRECT_URL", directUrl);

fs.writeFileSync(TOKENS, next.join("\n") + (next[next.length - 1] === "" ? "" : "\n"), "utf8");
console.log("Fixed GTR_DB_DEV_DATABASE_URL and GTR_DB_DEV_DIRECT_URL");
console.log("  ref:", ref);
console.log("  host:", regionHost);
console.log("  password URL-encoded: yes");
console.log("  pooler port: 6543 / session port: 5432");
