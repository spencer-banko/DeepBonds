import type { SupabaseClient } from "@supabase/supabase-js";
import { lookupCityCoordinates } from "@/lib/data/city-coordinates";

export interface CityCluster {
  city: string;
  state: string;
  lat: number;
  lng: number;
  count: number;
  companies: string[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getEmploymentClusters(supabase: SupabaseClient<any>): Promise<CityCluster[]> {
  const { data, error } = await supabase
    .from("employment_history")
    .select("city, state, company, is_current, profiles!inner(is_verified)")
    .eq("is_current", true)
    .eq("profiles.is_verified", true);

  if (error || !data) return [];

  const clusters = new Map<string, CityCluster>();

  for (const row of data as Array<{ city: string | null; state: string | null; company: string }>) {
    const coords = lookupCityCoordinates(row.city, row.state);
    if (!coords || !row.city || !row.state) continue;

    const key = `${row.city}, ${row.state}`.toLowerCase();
    const existing = clusters.get(key);
    if (existing) {
      existing.count += 1;
      if (!existing.companies.includes(row.company)) existing.companies.push(row.company);
    } else {
      clusters.set(key, {
        city: row.city,
        state: row.state,
        lat: coords[0],
        lng: coords[1],
        count: 1,
        companies: [row.company],
      });
    }
  }

  return Array.from(clusters.values()).sort((a, b) => b.count - a.count);
}
