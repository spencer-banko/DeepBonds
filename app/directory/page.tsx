import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getDirectoryProfiles, currentRole } from "@/lib/data/directory";

export default async function DirectoryPage({
  searchParams,
}: {
  searchParams: Promise<{
    college?: string;
    gradYear?: string;
    company?: string;
    industry?: string;
    city?: string;
    welcome?: string;
  }>;
}) {
  const filters = await searchParams;
  const supabase = await createClient();

  const { data: colleges } = await supabase.from("colleges").select("id, name").order("name");
  const profiles = await getDirectoryProfiles(supabase, filters);

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      {filters.welcome && (
        <div className="mb-6 rounded-md bg-accent/10 px-4 py-3 text-sm text-accent">
          Welcome to DeepBonds! If your account isn&apos;t yet verified, you&apos;ll show up here
          once a university admin reviews it.
        </div>
      )}

      <h1 className="text-2xl font-semibold">Alumni directory</h1>
      <p className="mt-1 text-sm text-muted">
        Showing alumni visible within your network — scoped by your university&apos;s package.
      </p>

      <form className="mt-6 grid grid-cols-2 gap-3 rounded-xl border border-[var(--border)] bg-surface p-4 sm:grid-cols-5">
        <select
          name="college"
          defaultValue={filters.college ?? ""}
          className="rounded-md border border-[var(--border)] bg-transparent px-2 py-1.5 text-sm"
        >
          <option value="">All departments</option>
          {colleges?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <input
          name="gradYear"
          placeholder="Grad year"
          defaultValue={filters.gradYear ?? ""}
          className="rounded-md border border-[var(--border)] bg-transparent px-2 py-1.5 text-sm"
        />
        <input
          name="company"
          placeholder="Company"
          defaultValue={filters.company ?? ""}
          className="rounded-md border border-[var(--border)] bg-transparent px-2 py-1.5 text-sm"
        />
        <input
          name="industry"
          placeholder="Industry"
          defaultValue={filters.industry ?? ""}
          className="rounded-md border border-[var(--border)] bg-transparent px-2 py-1.5 text-sm"
        />
        <input
          name="city"
          placeholder="City"
          defaultValue={filters.city ?? ""}
          className="rounded-md border border-[var(--border)] bg-transparent px-2 py-1.5 text-sm"
        />
        <button
          type="submit"
          className="col-span-2 rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-dark sm:col-span-1"
        >
          Filter
        </button>
      </form>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {profiles.map((profile) => {
          const role = currentRole(profile);
          return (
            <Link
              key={profile.id}
              href={`/profile/${profile.id}`}
              className="rounded-xl border border-[var(--border)] bg-surface p-5 hover:border-brand"
            >
              <h3 className="font-medium">{profile.full_name}</h3>
              <p className="mt-1 text-sm text-muted">
                {profile.degree} {profile.major}
                {profile.grad_year ? ` · Class of ${profile.grad_year}` : ""}
              </p>
              {role && (
                <p className="mt-3 text-sm">
                  {role.title} at <span className="font-medium">{role.company}</span>
                  {role.city ? ` — ${role.city}${role.state ? `, ${role.state}` : ""}` : ""}
                </p>
              )}
              {profile.profile_colleges.length > 0 && (
                <p className="mt-3 text-xs text-muted">
                  {profile.profile_colleges.map((pc) => pc.colleges?.name).filter(Boolean).join(", ")}
                </p>
              )}
            </Link>
          );
        })}
      </div>

      {profiles.length === 0 && (
        <p className="mt-10 text-center text-sm text-muted">
          No alumni match these filters yet.
        </p>
      )}
    </div>
  );
}
