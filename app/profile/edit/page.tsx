import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateProfile, addEmployment, deleteEmployment } from "./actions";

export default async function EditProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*, employment_history(*)")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) redirect("/onboarding");

  const employment = [...(profile.employment_history ?? [])].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="text-2xl font-semibold">Edit your profile</h1>
      {!profile.is_verified && (
        <p className="mt-2 rounded-md bg-accent/10 px-3 py-2 text-sm text-accent">
          Your account is pending verification from a university admin. You won&apos;t appear in the
          directory until then.
        </p>
      )}

      <form action={updateProfile} className="mt-6 space-y-4 rounded-xl border border-[var(--border)] bg-surface p-5">
        <div>
          <label className="block text-sm font-medium">Full name</label>
          <input
            name="fullName"
            defaultValue={profile.full_name ?? ""}
            className="mt-1 w-full rounded-md border border-[var(--border)] bg-transparent px-3 py-2 text-sm"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium">Graduation year</label>
            <input
              name="gradYear"
              type="number"
              defaultValue={profile.grad_year ?? ""}
              className="mt-1 w-full rounded-md border border-[var(--border)] bg-transparent px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Degree</label>
            <input
              name="degree"
              defaultValue={profile.degree ?? ""}
              className="mt-1 w-full rounded-md border border-[var(--border)] bg-transparent px-3 py-2 text-sm"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium">Major</label>
          <input
            name="major"
            defaultValue={profile.major ?? ""}
            className="mt-1 w-full rounded-md border border-[var(--border)] bg-transparent px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Bio</label>
          <textarea
            name="bio"
            rows={3}
            defaultValue={profile.bio ?? ""}
            className="mt-1 w-full rounded-md border border-[var(--border)] bg-transparent px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark"
        >
          Save
        </button>
      </form>

      <h2 className="mt-10 text-lg font-medium">Employment history</h2>
      <div className="mt-4 space-y-3">
        {employment.map((job) => (
          <div
            key={job.id}
            className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-surface p-4"
          >
            <div>
              <p className="font-medium">
                {job.title} · {job.company} {job.is_current ? "(current)" : ""}
              </p>
              <p className="text-sm text-muted">
                {job.industry ? `${job.industry} · ` : ""}
                {job.city}
                {job.state ? `, ${job.state}` : ""}
              </p>
            </div>
            <form action={deleteEmployment}>
              <input type="hidden" name="id" value={job.id} />
              <button type="submit" className="text-sm text-red-600 hover:underline">
                Remove
              </button>
            </form>
          </div>
        ))}
      </div>

      <form
        action={addEmployment}
        className="mt-4 grid grid-cols-2 gap-3 rounded-xl border border-dashed border-[var(--border)] p-5"
      >
        <input
          name="title"
          placeholder="Job title"
          required
          className="rounded-md border border-[var(--border)] bg-transparent px-3 py-2 text-sm"
        />
        <input
          name="company"
          placeholder="Company"
          required
          className="rounded-md border border-[var(--border)] bg-transparent px-3 py-2 text-sm"
        />
        <input
          name="industry"
          placeholder="Industry"
          className="rounded-md border border-[var(--border)] bg-transparent px-3 py-2 text-sm"
        />
        <div className="flex gap-2">
          <input
            name="city"
            placeholder="City"
            className="w-2/3 rounded-md border border-[var(--border)] bg-transparent px-3 py-2 text-sm"
          />
          <input
            name="state"
            placeholder="ST"
            maxLength={2}
            className="w-1/3 rounded-md border border-[var(--border)] bg-transparent px-3 py-2 text-sm uppercase"
          />
        </div>
        <label className="col-span-2 flex items-center gap-2 text-sm">
          <input type="checkbox" name="isCurrent" defaultChecked />
          This is my current role
        </label>
        <button
          type="submit"
          className="col-span-2 rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark"
        >
          Add role
        </button>
      </form>
    </div>
  );
}
