-- ============================================================
-- GTR-Pickelball — RLS multi-tenant (P1 sécurité v3.6)
-- Schema Prisma: pb | Tables: pb_*
-- Accès: propriétaire (managerId) OU co-gestionnaire
-- Note: Prisma (DATABASE_URL) contourne le RLS; policies pour
--       PostgREST / client Supabase (défense en profondeur).
-- ============================================================

-- Helper expression: user manages league L
-- (auth.uid()::text = L.managerId) OR exists co_manager

-- Enable RLS
ALTER TABLE IF EXISTS pb.pb_leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS pb.pb_co_managers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS pb.pb_managers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS pb.pb_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS pb.pb_courts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS pb.pb_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS pb.pb_attendances ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS pb.pb_matches ENABLE ROW LEVEL SECURITY;

-- Drop old policies if re-run
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT policyname, tablename
    FROM pg_policies
    WHERE schemaname = 'pb'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON pb.%I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- ===== LEAGUES =====
CREATE POLICY "leagues_select_managed" ON pb.pb_leagues
  FOR SELECT TO authenticated
  USING (
    "managerId" = (auth.uid())::text
    OR EXISTS (
      SELECT 1 FROM pb.pb_co_managers c
      WHERE c."leagueId" = pb.pb_leagues.id
        AND c."managerId" = (auth.uid())::text
    )
  );

CREATE POLICY "leagues_insert_own" ON pb.pb_leagues
  FOR INSERT TO authenticated
  WITH CHECK ("managerId" = (auth.uid())::text);

CREATE POLICY "leagues_update_managed" ON pb.pb_leagues
  FOR UPDATE TO authenticated
  USING (
    "managerId" = (auth.uid())::text
    OR EXISTS (
      SELECT 1 FROM pb.pb_co_managers c
      WHERE c."leagueId" = pb.pb_leagues.id AND c."managerId" = (auth.uid())::text
    )
  )
  WITH CHECK (
    "managerId" = (auth.uid())::text
    OR EXISTS (
      SELECT 1 FROM pb.pb_co_managers c
      WHERE c."leagueId" = pb.pb_leagues.id AND c."managerId" = (auth.uid())::text
    )
  );

CREATE POLICY "leagues_delete_owner" ON pb.pb_leagues
  FOR DELETE TO authenticated
  USING ("managerId" = (auth.uid())::text);

-- ===== CO-MANAGERS =====
CREATE POLICY "comanagers_select" ON pb.pb_co_managers
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM pb.pb_leagues l
      WHERE l.id = "leagueId"
        AND (
          l."managerId" = (auth.uid())::text
          OR EXISTS (
            SELECT 1 FROM pb.pb_co_managers c2
            WHERE c2."leagueId" = l.id AND c2."managerId" = (auth.uid())::text
          )
        )
    )
  );

CREATE POLICY "comanagers_write_owner" ON pb.pb_co_managers
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM pb.pb_leagues l
      WHERE l.id = "leagueId" AND l."managerId" = (auth.uid())::text
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM pb.pb_leagues l
      WHERE l.id = "leagueId" AND l."managerId" = (auth.uid())::text
    )
  );

-- ===== MANAGERS (self) =====
CREATE POLICY "managers_select_self" ON pb.pb_managers
  FOR SELECT TO authenticated
  USING (id = (auth.uid())::text);

CREATE POLICY "managers_upsert_self" ON pb.pb_managers
  FOR ALL TO authenticated
  USING (id = (auth.uid())::text)
  WITH CHECK (id = (auth.uid())::text);

-- ===== PLAYERS / COURTS / SESSIONS (via league) =====
CREATE POLICY "players_managed" ON pb.pb_players
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM pb.pb_leagues l
      WHERE l.id = "leagueId"
        AND (
          l."managerId" = (auth.uid())::text
          OR EXISTS (SELECT 1 FROM pb.pb_co_managers c WHERE c."leagueId" = l.id AND c."managerId" = (auth.uid())::text)
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM pb.pb_leagues l
      WHERE l.id = "leagueId"
        AND (
          l."managerId" = (auth.uid())::text
          OR EXISTS (SELECT 1 FROM pb.pb_co_managers c WHERE c."leagueId" = l.id AND c."managerId" = (auth.uid())::text)
        )
    )
  );

CREATE POLICY "courts_managed" ON pb.pb_courts
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM pb.pb_leagues l
      WHERE l.id = "leagueId"
        AND (
          l."managerId" = (auth.uid())::text
          OR EXISTS (SELECT 1 FROM pb.pb_co_managers c WHERE c."leagueId" = l.id AND c."managerId" = (auth.uid())::text)
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM pb.pb_leagues l
      WHERE l.id = "leagueId"
        AND (
          l."managerId" = (auth.uid())::text
          OR EXISTS (SELECT 1 FROM pb.pb_co_managers c WHERE c."leagueId" = l.id AND c."managerId" = (auth.uid())::text)
        )
    )
  );

CREATE POLICY "sessions_managed" ON pb.pb_sessions
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM pb.pb_leagues l
      WHERE l.id = "leagueId"
        AND (
          l."managerId" = (auth.uid())::text
          OR EXISTS (SELECT 1 FROM pb.pb_co_managers c WHERE c."leagueId" = l.id AND c."managerId" = (auth.uid())::text)
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM pb.pb_leagues l
      WHERE l.id = "leagueId"
        AND (
          l."managerId" = (auth.uid())::text
          OR EXISTS (SELECT 1 FROM pb.pb_co_managers c WHERE c."leagueId" = l.id AND c."managerId" = (auth.uid())::text)
        )
    )
  );

-- Attendance / Matches: via session -> league
CREATE POLICY "attendances_managed" ON pb.pb_attendances
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM pb.pb_sessions s
      JOIN pb.pb_leagues l ON l.id = s."leagueId"
      WHERE s.id = "sessionId"
        AND (
          l."managerId" = (auth.uid())::text
          OR EXISTS (SELECT 1 FROM pb.pb_co_managers c WHERE c."leagueId" = l.id AND c."managerId" = (auth.uid())::text)
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM pb.pb_sessions s
      JOIN pb.pb_leagues l ON l.id = s."leagueId"
      WHERE s.id = "sessionId"
        AND (
          l."managerId" = (auth.uid())::text
          OR EXISTS (SELECT 1 FROM pb.pb_co_managers c WHERE c."leagueId" = l.id AND c."managerId" = (auth.uid())::text)
        )
    )
  );

CREATE POLICY "matches_managed" ON pb.pb_matches
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM pb.pb_sessions s
      JOIN pb.pb_leagues l ON l.id = s."leagueId"
      WHERE s.id = "sessionId"
        AND (
          l."managerId" = (auth.uid())::text
          OR EXISTS (SELECT 1 FROM pb.pb_co_managers c WHERE c."leagueId" = l.id AND c."managerId" = (auth.uid())::text)
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM pb.pb_sessions s
      JOIN pb.pb_leagues l ON l.id = s."leagueId"
      WHERE s.id = "sessionId"
        AND (
          l."managerId" = (auth.uid())::text
          OR EXISTS (SELECT 1 FROM pb.pb_co_managers c WHERE c."leagueId" = l.id AND c."managerId" = (auth.uid())::text)
        )
    )
  );
