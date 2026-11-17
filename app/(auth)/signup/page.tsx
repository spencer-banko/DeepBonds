import { createClient } from "@/lib/supabase/server";
import { InviteSignupForm } from "./invite-form";
import { SelfRegisterForm } from "./self-register-form";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string }>;
}) {
  const { token, error } = await searchParams;
  const supabase = await createClient();

  if (token) {
    const { data: rawData, error: rpcError } = await supabase
      .rpc("get_invitation_by_token", { p_token: token })
      .maybeSingle();

    const data = rawData as {
      university_name: string;
      college_name: string | null;
      email: string;
      status: string;
      expires_at: string;
    } | null;

    if (rpcError || !data) {
      return (
        <div className="mx-auto max-w-md px-6 py-16 text-center">
          <h1 className="text-xl font-semibold">Invitation not found</h1>
          <p className="mt-2 text-sm text-muted">
            This invite link looks invalid. Ask your university administrator to resend it.
          </p>
        </div>
      );
    }

    if (data.status !== "pending") {
      return (
        <div className="mx-auto max-w-md px-6 py-16 text-center">
          <h1 className="text-xl font-semibold">This invitation has already been used</h1>
          <p className="mt-2 text-sm text-muted">Try logging in instead.</p>
        </div>
      );
    }

    return (
      <InviteSignupForm
        token={token}
        error={error}
        invite={{
          university_name: data.university_name,
          college_name: data.college_name,
          email: data.email,
        }}
      />
    );
  }

  const { data: universities } = await supabase.from("universities").select("id, name").order("name");
  const { data: colleges } = await supabase
    .from("colleges")
    .select("id, name, university_id")
    .order("name");

  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <h1 className="text-2xl font-semibold">Request access</h1>
      <p className="mt-2 text-sm text-muted">
        No invite in hand? Register directly and a university admin will verify your affiliation.
      </p>
      <SelfRegisterForm universities={universities ?? []} colleges={colleges ?? []} error={error} />
    </div>
  );
}
