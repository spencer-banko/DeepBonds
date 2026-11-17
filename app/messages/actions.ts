"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function startConversation(formData: FormData) {
  const supabase = await createClient();
  const recipientId = String(formData.get("recipientId") ?? "");
  const body = String(formData.get("body") ?? "").trim();

  if (!recipientId || !body) redirect(`/messages/new?with=${recipientId}&error=Message+can%27t+be+empty`);

  const { data: conversationId, error } = await supabase.rpc("send_message", {
    p_recipient: recipientId,
    p_body: body,
  });

  if (error) {
    redirect(`/messages/new?with=${recipientId}&error=${encodeURIComponent(error.message)}`);
  }

  redirect(`/messages/${conversationId}`);
}

export async function replyToConversation(formData: FormData) {
  const supabase = await createClient();
  const conversationId = String(formData.get("conversationId") ?? "");
  const recipientId = String(formData.get("recipientId") ?? "");
  const body = String(formData.get("body") ?? "").trim();

  if (!body) return;

  await supabase.rpc("send_message", { p_recipient: recipientId, p_body: body });
  revalidatePath(`/messages/${conversationId}`);
}

export async function acceptRequest(formData: FormData) {
  const supabase = await createClient();
  const conversationId = String(formData.get("conversationId") ?? "");
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase
    .from("conversation_participants")
    .update({ status: "accepted" })
    .eq("conversation_id", conversationId)
    .eq("profile_id", user.id);

  revalidatePath(`/messages/${conversationId}`);
}

export async function blockUser(formData: FormData) {
  const supabase = await createClient();
  const blockedId = String(formData.get("blockedId") ?? "");
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase.from("blocks").insert({ blocker_id: user.id, blocked_id: blockedId });
  redirect("/messages");
}

export async function reportUser(formData: FormData) {
  const supabase = await createClient();
  const reportedId = String(formData.get("reportedId") ?? "");
  const reason = String(formData.get("reason") ?? "Reported from a conversation");
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase.from("reports").insert({ reporter_id: user.id, reported_id: reportedId, reason });
}
