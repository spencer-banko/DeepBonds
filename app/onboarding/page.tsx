import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Landing pad after signup/login. Finishes creating the profile row from the
// metadata stashed during signup — this is what makes onboarding work
// whether or not the Supabase project requires email confirmation, since it
// runs on the first authenticated request rather than right after signUp().
export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (existing) {
    redirect("/directory");
  }

  const meta = user.user_metadata as Record<string, unknown>;
  const pendingInviteToken = meta.pending_invite_token as string | undefined;

  if (pendingInviteToken) {
    const { error } = await supabase.rpc("accept_invitation", {
      p_token: pendingInviteToken,
      p_full_name: (meta.full_name as string) ?? "",
      p_grad_year: (meta.grad_year as number | null) ?? null,
      p_degree: (meta.degree as string | null) ?? null,
      p_major: (meta.major as string | null) ?? null,
    });

    if (error) {
      return (
        <div className="mx-auto max-w-lg px-6 py-16 text-center">
          <h1 className="text-xl font-semibold">We couldn&apos;t finish setting up your account</h1>
          <p className="mt-2 text-sm text-muted">{error.message}</p>
        </div>
      );
    }

    redirect("/directory");
  }

  const universityId = meta.university_id as string | undefined;
  const collegeIds = (meta.college_ids as string[] | undefined) ?? [];

  if (!universityId) {
    return (
      <div className="mx-auto max-w-lg px-6 py-16 text-center">
        <h1 className="text-xl font-semibold">Missing registration details</h1>
        <p className="mt-2 text-sm text-muted">
          We don&apos;t have enough information to finish creating your profile. Please sign up again.
        </p>
      </div>
    );
  }

  const { error: profileError } = await supabase.from("profiles").insert({
    id: user.id,
    university_id: universityId,
    full_name: (meta.full_name as string) ?? "",
    grad_year: (meta.grad_year as number | null) ?? null,
    degree: (meta.degree as string | null) ?? null,
    major: (meta.major as string | null) ?? null,
    is_verified: false,
  });

  if (profileError) {
    return (
      <div className="mx-auto max-w-lg px-6 py-16 text-center">
        <h1 className="text-xl font-semibold">We couldn&apos;t finish setting up your account</h1>
        <p className="mt-2 text-sm text-muted">{profileError.message}</p>
      </div>
    );
  }

  if (collegeIds.length > 0) {
    await supabase
      .from("profile_colleges")
      .insert(collegeIds.map((collegeId) => ({ profile_id: user.id, college_id: collegeId })));
  }

  redirect("/directory?welcome=1");
}
