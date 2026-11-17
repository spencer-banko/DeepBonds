import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { replyToConversation, acceptRequest, blockUser, reportUser } from "../actions";

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const { conversationId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: participants } = await supabase
    .from("conversation_participants")
    .select("profile_id, status, profiles(id, full_name)")
    .eq("conversation_id", conversationId);

  if (!participants || participants.length === 0) notFound();

  const me = participants.find((p) => p.profile_id === user.id);
  const other = participants.find((p) => p.profile_id !== user.id);
  if (!me || !other) notFound();

  const { data: messages } = await supabase
    .from("messages")
    .select("id, body, sender_id, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  return (
    <div className="mx-auto flex h-[calc(100vh-73px)] max-w-2xl flex-col px-6 py-6">
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
        <h1 className="text-lg font-semibold">
          {(other.profiles as unknown as { full_name: string | null } | null)?.full_name}
        </h1>
        <div className="flex items-center gap-3 text-sm">
          <form action={reportUser}>
            <input type="hidden" name="reportedId" value={other.profile_id} />
            <input type="hidden" name="reason" value="Reported from conversation" />
            <button type="submit" className="text-muted hover:text-foreground">
              Report
            </button>
          </form>
          <form action={blockUser}>
            <input type="hidden" name="blockedId" value={other.profile_id} />
            <button type="submit" className="text-red-600 hover:underline">
              Block
            </button>
          </form>
        </div>
      </div>

      {me.status === "pending" && (
        <div className="mt-4 flex items-center justify-between rounded-md bg-accent/10 px-4 py-3 text-sm text-accent">
          <span>This is a message request.</span>
          <form action={acceptRequest}>
            <input type="hidden" name="conversationId" value={conversationId} />
            <button type="submit" className="font-medium underline">
              Accept
            </button>
          </form>
        </div>
      )}

      <div className="mt-4 flex-1 space-y-3 overflow-y-auto">
        {(messages ?? []).map((message) => (
          <div
            key={message.id}
            className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
              message.sender_id === user.id
                ? "ml-auto bg-brand text-white"
                : "bg-black/5 dark:bg-white/10"
            }`}
          >
            {message.body}
          </div>
        ))}
      </div>

      <form action={replyToConversation} className="mt-4 flex gap-2">
        <input type="hidden" name="conversationId" value={conversationId} />
        <input type="hidden" name="recipientId" value={other.profile_id} />
        <input
          name="body"
          required
          placeholder="Write a message…"
          className="flex-1 rounded-full border border-[var(--border)] bg-transparent px-4 py-2 text-sm"
        />
        <button
          type="submit"
          className="rounded-full bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark"
        >
          Send
        </button>
      </form>
    </div>
  );
}
