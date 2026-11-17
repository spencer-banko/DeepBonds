"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signIn(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/onboarding");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

interface InviteSignupInput {
  email: string;
  password: string;
  fullName: string;
  gradYear: string;
  degree: string;
  major: string;
  inviteToken: string;
}

export async function signUpWithInvite(input: InviteSignupInput) {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      data: {
        pending_invite_token: input.inviteToken,
        full_name: input.fullName,
        grad_year: input.gradYear ? Number(input.gradYear) : null,
        degree: input.degree || null,
        major: input.major || null,
      },
    },
  });

  if (error) {
    redirect(`/signup?token=${encodeURIComponent(input.inviteToken)}&error=${encodeURIComponent(error.message)}`);
  }

  if (data.session) {
    redirect("/onboarding");
  }

  redirect("/check-email");
}

interface SelfRegisterInput {
  email: string;
  password: string;
  fullName: string;
  gradYear: string;
  degree: string;
  major: string;
  universityId: string;
  collegeIds: string[];
}

export async function signUpSelf(input: SelfRegisterInput) {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      data: {
        full_name: input.fullName,
        grad_year: input.gradYear ? Number(input.gradYear) : null,
        degree: input.degree || null,
        major: input.major || null,
        university_id: input.universityId,
        college_ids: input.collegeIds,
      },
    },
  });

  if (error) {
    redirect(`/signup?error=${encodeURIComponent(error.message)}`);
  }

  if (data.session) {
    redirect("/onboarding");
  }

  redirect("/check-email");
}
