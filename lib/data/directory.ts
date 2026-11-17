import type { SupabaseClient } from "@supabase/supabase-js";

export interface DirectoryFilters {
  college?: string;
  gradYear?: string;
  company?: string;
  industry?: string;
  city?: string;
}

export interface DirectoryProfile {
  id: string;
  full_name: string | null;
  grad_year: number | null;
  degree: string | null;
  major: string | null;
  avatar_url: string | null;
  employment_history: Array<{
    company: string;
    title: string;
    industry: string | null;
    city: string | null;
    state: string | null;
    is_current: boolean;
  }>;
  profile_colleges: Array<{ colleges: { id: string; name: string } | null }>;
}

// Fetches the viewer's visible network (RLS already enforces the
// department vs. university-wide scoping) and applies the directory filters
// in JS. Keeps the Postgres query simple and avoids fighting PostgREST's
// embedded-resource filter syntax for a handful of optional text filters.
export async function getDirectoryProfiles(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
  filters: DirectoryFilters
): Promise<DirectoryProfile[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select(
      `id, full_name, grad_year, degree, major, avatar_url,
       employment_history(company, title, industry, city, state, is_current),
       profile_colleges(colleges(id, name))`
    )
    .eq("is_verified", true)
    .order("full_name");

  if (error || !data) return [];

  let results = data as unknown as DirectoryProfile[];

  if (filters.college) {
    results = results.filter((p) =>
      p.profile_colleges.some((pc) => pc.colleges?.id === filters.college)
    );
  }
  if (filters.gradYear) {
    results = results.filter((p) => String(p.grad_year ?? "") === filters.gradYear);
  }
  if (filters.company) {
    const needle = filters.company.toLowerCase();
    results = results.filter((p) =>
      p.employment_history.some((e) => e.company?.toLowerCase().includes(needle))
    );
  }
  if (filters.industry) {
    const needle = filters.industry.toLowerCase();
    results = results.filter((p) =>
      p.employment_history.some((e) => e.industry?.toLowerCase().includes(needle))
    );
  }
  if (filters.city) {
    const needle = filters.city.toLowerCase();
    results = results.filter((p) =>
      p.employment_history.some((e) => e.city?.toLowerCase().includes(needle))
    );
  }

  return results;
}

export function currentRole(profile: DirectoryProfile) {
  return (
    profile.employment_history.find((e) => e.is_current) ?? profile.employment_history[0] ?? null
  );
}
