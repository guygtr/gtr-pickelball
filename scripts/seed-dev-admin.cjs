/**
 * Create Supabase Auth user on GTR-Database-Dev and align pb.pb_managers.
 * Default: guy.gtr@gmail.com (ADMIN_EMAILS) with a known temp password.
 */
const { createClient } = require("@supabase/supabase-js");
const { Client } = require("pg");
const fs = require("fs");
const crypto = require("crypto");

function loadTokens() {
  const t = {};
  for (const line of fs.readFileSync("D:/GrokBuild/.tokens/gtr-tokens.env", "utf8").split(/\r?\n/)) {
    const s = line.trim();
    if (!s || s.startsWith("#")) continue;
    const i = s.indexOf("=");
    if (i < 1) continue;
    t[s.slice(0, i).trim()] = s.slice(i + 1).trim().replace(/^["']|["']$/g, "");
  }
  // also merge pickelball .env.local for ADMIN if needed
  const local = "D:/GrokBuild/Projects/GTR-Pickelball/.env.local";
  if (fs.existsSync(local)) {
    for (const line of fs.readFileSync(local, "utf8").split(/\r?\n/)) {
      const s = line.trim();
      if (!s || s.startsWith("#")) continue;
      const i = s.indexOf("=");
      if (i < 1) continue;
      const k = s.slice(0, i).trim();
      if (!t[k]) t[k] = s.slice(i + 1).trim().replace(/^["']|["']$/g, "");
    }
  }
  return t;
}

function q(id) {
  return `"${String(id).replace(/"/g, '""')}"`;
}

(async () => {
  const t = loadTokens();
  const url = t.GTR_DB_DEV_SUPABASE_URL;
  const service = t.GTR_DB_DEV_SUPABASE_SERVICE_ROLE_KEY;
  const dbUrl = t.GTR_DB_DEV_DATABASE_URL;
  if (!url || !service || !dbUrl) {
    console.error("Missing GTR_DB_DEV_* keys");
    process.exit(1);
  }

  const email =
    process.env.DEV_ADMIN_EMAIL ||
    (t.ADMIN_EMAILS || "guy.gtr@gmail.com").split(",")[0].trim();
  // Generate once and print — user needs it for local login
  const password =
    process.env.DEV_ADMIN_PASSWORD ||
    `Dev-${crypto.randomBytes(4).toString("hex")}-Pb!`;

  const admin = createClient(url, service, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const pg = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  await pg.connect();

  // Existing managers on Dev (from prod copy)
  const managers = (
    await pg.query(`select id, email, name, role from pb.pb_managers order by email`)
  ).rows;
  console.log("pb_managers on Dev:", managers.length);
  managers.forEach((m) => console.log(" -", m.email, m.id, m.role));

  const existingMgr = managers.find(
    (m) => (m.email || "").toLowerCase() === email.toLowerCase()
  );

  // Create or get auth user
  let userId = null;
  const list = await admin.auth.admin.listUsers({ perPage: 200 });
  if (list.error) throw list.error;
  const found = (list.data.users || []).find(
    (u) => (u.email || "").toLowerCase() === email.toLowerCase()
  );

  if (found) {
    userId = found.id;
    const upd = await admin.auth.admin.updateUserById(userId, {
      password,
      email_confirm: true,
    });
    if (upd.error) throw upd.error;
    console.log("Auth user updated:", email, userId);
  } else {
    const created = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name: existingMgr?.name || "Dev Admin" },
    });
    if (created.error) throw created.error;
    userId = created.data.user.id;
    console.log("Auth user created:", email, userId);
  }

  // Align pb_managers: if manager exists with different id, re-key carefully
  const byNewId = (
    await pg.query(`select id, email from pb.pb_managers where id = $1`, [userId])
  ).rows[0];
  const byEmail = (
    await pg.query(`select id, email, name, role from pb.pb_managers where lower(email) = lower($1)`, [
      email,
    ])
  ).rows[0];

  if (byEmail && byEmail.id !== userId) {
    const oldId = byEmail.id;
    console.log("Re-keying pb_managers", oldId, "→", userId);

    // Insert new manager row first (temp email on old to free unique email)
    await pg.query(`update pb.pb_managers set email = $1 where id = $2`, [
      `old-${oldId.slice(0, 8)}@dev.local`,
      oldId,
    ]);
    await pg.query(
      `insert into pb.pb_managers (id, email, name, role, ${q("createdAt")}, ${q("updatedAt")})
       values ($1, $2, $3, $4, now(), now())`,
      [userId, email, byEmail.name || "Dev Admin", byEmail.role || "admin"]
    );

    await pg.query(`update pb.pb_leagues set ${q("managerId")} = $1 where ${q("managerId")} = $2`, [
      userId,
      oldId,
    ]);
    try {
      await pg.query(
        `update pb.pb_co_managers set ${q("managerId")} = $1 where ${q("managerId")} = $2`,
        [userId, oldId]
      );
    } catch (e) {
      console.warn("co_managers update:", e.message);
    }

    await pg.query(`delete from pb.pb_managers where id = $1`, [oldId]);
    console.log("Re-key complete");
  } else if (!byNewId && !byEmail) {
    await pg.query(
      `insert into pb.pb_managers (id, email, name, role, ${q("createdAt")}, ${q("updatedAt")})
       values ($1, $2, $3, $4, now(), now())`,
      [userId, email, "Dev Admin", "admin"]
    );
    console.log("Inserted pb_managers row for new admin");
  } else if (byNewId) {
    await pg.query(
      `update pb.pb_managers set email = $2, role = 'admin', ${q("updatedAt")} = now() where id = $1`,
      [userId, email]
    );
    console.log("pb_managers already has auth id");
  }

  // Ensure at least one league is owned by this user if they own none
  const owned = await pg.query(
    `select count(*)::int as n from pb.pb_leagues where ${q("managerId")} = $1`,
    [userId]
  );
  if (owned.rows[0].n === 0) {
    const any = await pg.query(`select id, name from pb.pb_leagues limit 1`);
    if (any.rows[0]) {
      await pg.query(`update pb.pb_leagues set ${q("managerId")} = $1 where id = $2`, [
        userId,
        any.rows[0].id,
      ]);
      console.log("Assigned league ownership:", any.rows[0].name, any.rows[0].id);
    }
  }

  const finalLeagues = await pg.query(
    `select id, name, ${q("managerId")} as mid from pb.pb_leagues order by name`
  );
  console.log("\nLeagues on Dev:");
  finalLeagues.rows.forEach((l) => console.log(" -", l.name, "manager=", l.mid));

  await pg.end();

  console.log("\n=== DEV LOGIN ===");
  console.log("URL:     http://localhost:3000 (npm run dev in GTR-Pickelball)");
  console.log("Email:  ", email);
  console.log("Password:", password);
  console.log("(Change password after first login if desired.)");
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
