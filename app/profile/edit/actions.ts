"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: String(formData.get("fullName") ?? ""),
      grad_year: formData.get("gradYear") ? Number(formData.get("gradYear")) : null,
      degree: String(formData.get("degree") ?? "") || null,
      major: String(formData.get("major") ?? "") || null,
      bio: String(formData.get("bio") ?? "") || null,
    })
    .eq("id", user.id);

  if (!error) revalidatePath("/profile/edit");
}

export async function addEmployment(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const isCurrent = formData.get("isCurrent") === "on";

  if (isCurrent) {
    await supabase.from("employment_history").update({ is_current: false }).eq("profile_id", user.id);
  }

  await supabase.from("employment_history").insert({
    profile_id: user.id,
    company: String(formData.get("company") ?? ""),
    title: String(formData.get("title") ?? ""),
    industry: String(formData.get("industry") ?? "") || null,
    city: String(formData.get("city") ?? "") || null,
    state: String(formData.get("state") ?? "") || null,
    is_current: isCurrent,
  });

  revalidatePath("/profile/edit");
}

export async function deleteEmployment(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const id = String(formData.get("id") ?? "");
  await supabase.from("employment_history").delete().eq("id", id).eq("profile_id", user.id);
  revalidatePath("/profile/edit");
}
