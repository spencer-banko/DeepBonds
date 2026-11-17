import { createClient } from "@/lib/supabase/server";
import { getEmploymentClusters } from "@/lib/data/map";
import { MapView } from "@/components/map-view";

export default async function MapPage() {
  const supabase = await createClient();
  const clusters = await getEmploymentClusters(supabase);
  const totalAlumni = clusters.reduce((sum, c) => sum + c.count, 0);

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="text-2xl font-semibold">Where your network works</h1>
      <p className="mt-1 text-sm text-muted">
        City-level clusters built from current employer locations alumni have shared.
        {totalAlumni > 0 ? ` ${totalAlumni} alumni mapped across ${clusters.length} cities.` : ""}
      </p>

      <div className="mt-8 rounded-xl border border-[var(--border)] bg-surface p-4">
        <MapView clusters={clusters} />
      </div>

      {clusters.length === 0 && (
        <p className="mt-6 text-center text-sm text-muted">
          No current employer cities on file yet — add yours from your profile.
        </p>
      )}
    </div>
  );
}
