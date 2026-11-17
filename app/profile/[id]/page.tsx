import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      `id, full_name, grad_year, degree, major, bio, avatar_url,
       university:universities(name),
       profile_colleges(colleges(id, name)),
       employment_history(id, company, title, industry, city, state, is_current, start_date, end_date)`
    )
    .eq("id", id)
    .maybeSingle();

  if (!profile) notFound();

  const isSelf = user?.id === id;
  const employment = [...(profile.employment_history ?? [])].sort((a, b) =>
    a.is_current === b.is_current ? 0 : a.is_current ? -1 : 1
  );

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{profile.full_name}</h1>
          <p className="mt-1 text-sm text-muted">
            {(profile.university as unknown as { name: string } | null)?.name}
            {profile.profile_colleges.length > 0
              ? ` · ${profile.profile_colleges
                  .map((pc) => (pc.colleges as unknown as { name: string } | null)?.name)
                  .filter(Boolean)
                  .join(", ")}`
              : ""}
          </p>
          <p className="mt-1 text-sm text-muted">
            {profile.degree} {profile.major}
            {profile.grad_year ? ` · Class of ${profile.grad_year}` : ""}
          </p>
        </div>

        {isSelf ? (
          <Link
            href="/profile/edit"
            className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-medium hover:border-brand"
          >
            Edit profile
          </Link>
        ) : (
          <Link
            href={`/messages/new?with=${profile.id}`}
            className="rounded-full bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark"
          >
            Message
          </Link>
        )}
      </div>

      {profile.bio && <p className="mt-6 text-sm leading-relaxed">{profile.bio}</p>}

      <h2 className="mt-10 text-lg font-medium">Employment history</h2>
      <div className="mt-4 space-y-4">
        {employment.map((job) => (
          <div key={job.id} className="rounded-lg border border-[var(--border)] bg-surface p-4">
            <div className="flex items-center justify-between">
              <p className="font-medium">
                {job.title} · {job.company}
              </p>
              {job.is_current && (
                <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs text-accent">
                  Current
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-muted">
              {job.industry ? `${job.industry} · ` : ""}
              {job.city ? `${job.city}, ${job.state}` : job.state}
            </p>
          </div>
        ))}
        {employment.length === 0 && (
          <p className="text-sm text-muted">No employment history on file yet.</p>
        )}
      </div>
    </div>
  );
}
