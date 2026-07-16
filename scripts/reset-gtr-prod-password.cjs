/**
 * Reset password for a user on GTR-Database (prod) Auth.
 * Usage:
 *   node scripts/reset-gtr-prod-password.cjs [email] [optional-password]
 */
const { createClient } = require("@supabase/supabase-js");
const crypto = require("crypto");
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
  const email = (process.argv[2] || "guy.gtr@gmail.com").toLowerCase().trim();
  const password =
    process.argv[3] ||
    `GtrProd-${crypto.randomBytes(4).toString("hex")}-26!`;

  const url = t.GTR_DB_SUPABASE_URL;
  const key = t.GTR_DB_SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("Missing GTR_DB_SUPABASE_URL or SERVICE_ROLE_KEY");
    process.exit(1);
  }

  const admin = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: list, error: listErr } = await admin.auth.admin.listUsers({
    perPage: 200,
  });
  if (listErr) throw listErr;

  const user = (list.users || []).find(
    (u) => (u.email || "").toLowerCase() === email
  );
  if (!user) {
    console.error("User not found on GTR-Database Auth:", email);
    console.error(
      "Available:",
      (list.users || []).map((u) => u.email).join(", ")
    );
    process.exit(1);
  }

  const { data, error } = await admin.auth.admin.updateUserById(user.id, {
    password,
    email_confirm: true,
  });
  if (error) throw error;

  console.log("=== GTR-Database (PROD) password reset ===");
  console.log("Project:", url);
  console.log("User id:", data.user.id);
  console.log("Email:  ", email);
  console.log("Password:", password);
  console.log("Use this on https://bar.gtremblay.com (and Pickelball prod if same Auth).");
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
