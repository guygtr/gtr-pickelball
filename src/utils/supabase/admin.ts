import { createClient } from '@supabase/supabase-js';

/**
 * Client Supabase avec privilèges Service Role (Admin).
 * À utiliser UNIQUEMENT dans des Server Actions ou des API Routes sécurisées.
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Configuration Supabase Admin manquante (URL ou Service Role Key).");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
