import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { startConversation } from "../actions";

export default async function NewMessagePage({
  searchParams,
}: {
  searchParams: Promise<{ with?: string; error?: string }>;
}) {
  const { with: recipientId, error } = await searchParams;
  if (!recipientId) redirect("/directory");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: recipient } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("id", recipientId)
    .maybeSingle();

  if (!recipient) notFound();

  return (
    <div className="mx-auto max-w-lg px-6 py-16">
      <h1 className="text-xl font-semibold">Message {recipient.full_name}</h1>
      {error && <p className="mt-4 rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-600">{error}</p>}
      <form action={startConversation} className="mt-6 space-y-4">
        <input type="hidden" name="recipientId" value={recipient.id} />
        <textarea
          name="body"
          rows={4}
          required
          placeholder={`Say hello to ${recipient.full_name?.split(" ")[0] ?? "them"}…`}
          className="w-full rounded-md border border-[var(--border)] bg-transparent px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark"
        >
          Send message
        </button>
      </form>
    </div>
  );
}
