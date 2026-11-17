import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createInvitation, revokeInvitation, verifyMember, setPackageTier } from "./actions";

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*, university:universities(id, name, package_tier)")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.is_admin || !profile.university) redirect("/directory");

  const universityId = profile.university.id;

  const [{ data: colleges }, { data: invitations }, { data: members }] = await Promise.all([
    supabase.from("colleges").select("id, name").eq("university_id", universityId).order("name"),
    supabase
      .from("invitations")
      .select("id, email, status, created_at, colleges(name)")
      .eq("university_id", universityId)
      .order("created_at", { ascending: false }),
    supabase
      .from("profiles")
      .select("id, full_name, grad_year, is_verified, created_at")
      .eq("university_id", universityId)
      .order("created_at", { ascending: false }),
  ]);

  const verifiedCount = members?.filter((m) => m.is_verified).length ?? 0;
  const pendingMembers = members?.filter((m) => !m.is_verified) ?? [];
  const pendingInvites = invitations?.filter((i) => i.status === "pending").length ?? 0;

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="text-2xl font-semibold">{profile.university.name} admin</h1>

      <div className="mt-6 grid gap-4 sm:grid-cols-4">
        <Metric label="Verified alumni" value={verifiedCount} />
        <Metric label="Pending verification" value={pendingMembers.length} />
        <Metric label="Pending invites" value={pendingInvites} />
        <div className="rounded-xl border border-[var(--border)] bg-surface p-4">
          <p className="text-xs uppercase tracking-wide text-muted">Package</p>
          <p className="mt-1 text-sm font-medium capitalize">
            {profile.university.package_tier.replace("_", " ")}
          </p>
          <form action={setPackageTier} className="mt-2">
            <input
              type="hidden"
              name="tier"
              value={profile.university.package_tier === "department" ? "university_wide" : "department"}
            />
            <button type="submit" className="text-xs font-medium text-brand underline">
              {profile.university.package_tier === "department"
                ? "Upgrade to university-wide"
                : "Downgrade to department"}
            </button>
          </form>
        </div>
      </div>

      <section className="mt-10">
        <h2 className="text-lg font-medium">Send an invitation</h2>
        <form
          action={createInvitation}
          className="mt-3 grid grid-cols-1 gap-3 rounded-xl border border-[var(--border)] bg-surface p-4 sm:grid-cols-3"
        >
          <input
            name="email"
            type="email"
            required
            placeholder="alum@example.com"
            className="rounded-md border border-[var(--border)] bg-transparent px-3 py-2 text-sm"
          />
          <select
            name="collegeId"
            className="rounded-md border border-[var(--border)] bg-transparent px-3 py-2 text-sm"
          >
            <option value="">No specific department</option>
            {colleges?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark"
          >
            Send invite
          </button>
        </form>

        <div className="mt-4 divide-y divide-[var(--border)] rounded-xl border border-[var(--border)] bg-surface">
          {invitations?.map((invite) => (
            <div key={invite.id} className="flex items-center justify-between px-4 py-3 text-sm">
              <div>
                <p className="font-medium">{invite.email}</p>
                <p className="text-xs text-muted">
                  {(invite.colleges as unknown as { name: string } | null)?.name ?? "No department"} ·{" "}
                  {invite.status}
                </p>
              </div>
              {invite.status === "pending" && (
                <form action={revokeInvitation}>
                  <input type="hidden" name="id" value={invite.id} />
                  <button type="submit" className="text-xs text-red-600 hover:underline">
                    Revoke
                  </button>
                </form>
              )}
            </div>
          ))}
          {(!invitations || invitations.length === 0) && (
            <p className="px-4 py-6 text-center text-sm text-muted">No invitations sent yet.</p>
          )}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-medium">Pending verification</h2>
        <p className="mt-1 text-sm text-muted">
          Alumni who registered directly rather than through an invitation.
        </p>
        <div className="mt-3 divide-y divide-[var(--border)] rounded-xl border border-[var(--border)] bg-surface">
          {pendingMembers.map((member) => (
            <div key={member.id} className="flex items-center justify-between px-4 py-3 text-sm">
              <div>
                <p className="font-medium">{member.full_name}</p>
                <p className="text-xs text-muted">
                  {member.grad_year ? `Class of ${member.grad_year}` : "No graduation year on file"}
                </p>
              </div>
              <form action={verifyMember}>
                <input type="hidden" name="id" value={member.id} />
                <button
                  type="submit"
                  className="rounded-full bg-brand px-3 py-1 text-xs font-medium text-white hover:bg-brand-dark"
                >
                  Verify
                </button>
              </form>
            </div>
          ))}
          {pendingMembers.length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-muted">Nobody is waiting on verification.</p>
          )}
        </div>
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-surface p-4">
      <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}
