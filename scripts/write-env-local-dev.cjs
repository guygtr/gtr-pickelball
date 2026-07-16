/**
 * Write GTR-Pickelball/.env.local from GTR_DB_DEV_* tokens (+ GROK/ADMIN from prod .env if present).
 */
const fs = require("fs");
const path = require("path");

function loadEnvFile(p) {
  const t = {};
  if (!fs.existsSync(p)) return t;
  for (const line of fs.readFileSync(p, "utf8").split(/\r?\n/)) {
    const s = line.trim();
    if (!s || s.startsWith("#")) continue;
    const i = s.indexOf("=");
    if (i < 1) continue;
    t[s.slice(0, i).trim()] = s.slice(i + 1).trim().replace(/^["']|["']$/g, "");
  }
  return t;
}

const tokens = loadEnvFile("D:/GrokBuild/.tokens/gtr-tokens.env");
const existing = loadEnvFile(path.join(__dirname, "..", ".env"));

const required = [
  "GTR_DB_DEV_SUPABASE_URL",
  "GTR_DB_DEV_SUPABASE_ANON_KEY",
  "GTR_DB_DEV_SUPABASE_SERVICE_ROLE_KEY",
  "GTR_DB_DEV_DATABASE_URL",
];
for (const k of required) {
  if (!tokens[k]) {
    console.error("Missing", k);
    process.exit(1);
  }
}

const direct = tokens.GTR_DB_DEV_DIRECT_URL || tokens.GTR_DB_DEV_DATABASE_URL;
const grok = tokens.GROK_API_KEY || existing.GROK_API_KEY || "";
const admin = existing.ADMIN_EMAILS || tokens.ADMIN_EMAILS || "guy.gtr@gmail.com";

const content = `# ==========================================
# GTR-Pickelball LOCAL — GTR-Database-Dev
# Generated ${new Date().toISOString()}
# DO NOT USE PROD KEYS HERE
# ==========================================
NEXT_PUBLIC_SUPABASE_URL="${tokens.GTR_DB_DEV_SUPABASE_URL}"
NEXT_PUBLIC_SUPABASE_ANON_KEY="${tokens.GTR_DB_DEV_SUPABASE_ANON_KEY}"
SUPABASE_SERVICE_ROLE_KEY="${tokens.GTR_DB_DEV_SUPABASE_SERVICE_ROLE_KEY}"

DATABASE_URL="${tokens.GTR_DB_DEV_DATABASE_URL}"
DIRECT_URL="${direct}"

GROK_API_KEY="${grok}"
ADMIN_EMAILS="${admin}"
`;

const out = path.join(__dirname, "..", ".env.local");
fs.writeFileSync(out, content, "utf8");
console.log("Wrote", out);
console.log("  SUPABASE_URL:", tokens.GTR_DB_DEV_SUPABASE_URL);
console.log("  DATABASE: GTR-Database-Dev (pooler)");
