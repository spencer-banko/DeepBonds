import { createBrowserClient } from "@supabase/ssr";

// Not typed against a generated Database schema: the linked Supabase
// project was unreachable while scaffolding, so `supabase gen types
// typescript` couldn't run. Regenerate and re-add the generic once the
// migrations in supabase/migrations have been applied.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
