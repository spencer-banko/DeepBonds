import { createClient } from "@/lib/supabase/server";

export async function getCurrentUserAndProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { user: null, profile: null };

  const { data: profile } = await supabase
    .from("profiles")
    .select("*, university:universities(id, name, slug, package_tier)")
    .eq("id", user.id)
    .maybeSingle();

  return { user, profile };
}
