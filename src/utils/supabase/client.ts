import { createBrowserClient } from "@supabase/ssr";

/**
 * Crée un client Supabase pour une utilisation côté client (Client Components).
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
