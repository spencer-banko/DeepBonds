import { signUpWithInvite } from "@/app/(auth)/actions";

interface InviteDetails {
  university_name: string;
  college_name: string | null;
  email: string;
}

export function InviteSignupForm({ token, invite, error }: { token: string; invite: InviteDetails; error?: string }) {
  async function submit(formData: FormData) {
    "use server";
    await signUpWithInvite({
      email: invite.email,
      password: String(formData.get("password") ?? ""),
      fullName: String(formData.get("fullName") ?? ""),
      gradYear: String(formData.get("gradYear") ?? ""),
      degree: String(formData.get("degree") ?? ""),
      major: String(formData.get("major") ?? ""),
      inviteToken: token,
    });
  }

  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <h1 className="text-2xl font-semibold">You&apos;re invited</h1>
      <p className="mt-2 text-sm text-muted">
        {invite.university_name}
        {invite.college_name ? ` · ${invite.college_name}` : ""}
      </p>

      {error && <p className="mt-4 rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-600">{error}</p>}

      <form action={submit} className="mt-6 space-y-4">
        <div>
          <label className="block text-sm font-medium">Email</label>
          <input
            value={invite.email}
            disabled
            className="mt-1 w-full rounded-md border border-[var(--border)] bg-black/5 px-3 py-2 text-sm text-muted dark:bg-white/5"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Full name</label>
          <input
            name="fullName"
            required
            className="mt-1 w-full rounded-md border border-[var(--border)] bg-transparent px-3 py-2 text-sm"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium">Graduation year</label>
            <input
              name="gradYear"
              type="number"
              min={1900}
              max={2100}
              className="mt-1 w-full rounded-md border border-[var(--border)] bg-transparent px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Degree</label>
            <input
              name="degree"
              placeholder="B.S., M.S...."
              className="mt-1 w-full rounded-md border border-[var(--border)] bg-transparent px-3 py-2 text-sm"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium">Major</label>
          <input
            name="major"
            className="mt-1 w-full rounded-md border border-[var(--border)] bg-transparent px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Password</label>
          <input
            name="password"
            type="password"
            minLength={8}
            required
            className="mt-1 w-full rounded-md border border-[var(--border)] bg-transparent px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          className="w-full rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark"
        >
          Create account
        </button>
      </form>
    </div>
  );
}
