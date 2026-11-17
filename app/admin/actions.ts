"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, is_admin, university_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.is_admin || !profile.university_id) redirect("/directory");

  return { supabase, profile };
}

export async function createInvitation(formData: FormData) {
  const { supabase, profile } = await requireAdmin();

  const email = String(formData.get("email") ?? "").trim();
  const collegeId = String(formData.get("collegeId") ?? "") || null;
  if (!email) return;

  await supabase.from("invitations").insert({
    university_id: profile.university_id,
    college_id: collegeId,
    email,
    invited_by: profile.id,
  });

  revalidatePath("/admin");
}

export async function revokeInvitation(formData: FormData) {
  const { supabase, profile } = await requireAdmin();
  const id = String(formData.get("id") ?? "");

  await supabase
    .from("invitations")
    .update({ status: "revoked" })
    .eq("id", id)
    .eq("university_id", profile.university_id);

  revalidatePath("/admin");
}

export async function verifyMember(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = String(formData.get("id") ?? "");

  await supabase.rpc("admin_verify_member", { p_profile_id: id });

  revalidatePath("/admin");
}

export async function setPackageTier(formData: FormData) {
  const { supabase } = await requireAdmin();
  const tier = String(formData.get("tier") ?? "department");

  await supabase.rpc("admin_set_package_tier", { p_tier: tier });

  revalidatePath("/admin");
}
