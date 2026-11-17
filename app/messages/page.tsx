import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

interface ConversationRow {
  id: string;
  conversation_participants: Array<{
    profile_id: string;
    status: "accepted" | "pending";
    profiles: { id: string; full_name: string | null } | null;
  }>;
  messages: Array<{ id: string; body: string; sender_id: string; created_at: string }>;
}

export default async function MessagesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("conversations")
    .select(
      `id,
       conversation_participants(profile_id, status, profiles(id, full_name)),
       messages(id, body, sender_id, created_at)`
    )
    .order("created_at", { foreignTable: "messages", ascending: false });

  const conversations = (data ?? []) as unknown as ConversationRow[];

  const rows = conversations
    .map((c) => {
      const me = c.conversation_participants.find((p) => p.profile_id === user.id);
      const other = c.conversation_participants.find((p) => p.profile_id !== user.id);
      const lastMessage = c.messages[0];
      return { id: c.id, me, other: other?.profiles, lastMessage };
    })
    .filter((r) => r.me && r.other)
    .sort(
      (a, b) =>
        new Date(b.lastMessage?.created_at ?? 0).getTime() -
        new Date(a.lastMessage?.created_at ?? 0).getTime()
    );

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="text-2xl font-semibold">Messages</h1>

      <div className="mt-6 divide-y divide-[var(--border)] rounded-xl border border-[var(--border)] bg-surface">
        {rows.map((row) => (
          <Link
            key={row.id}
            href={`/messages/${row.id}`}
            className="flex items-center justify-between px-5 py-4 hover:bg-black/5 dark:hover:bg-white/5"
          >
            <div>
              <p className="font-medium">{row.other?.full_name ?? "Unknown"}</p>
              <p className="mt-0.5 truncate text-sm text-muted">{row.lastMessage?.body}</p>
            </div>
            {row.me?.status === "pending" && (
              <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs text-accent">
                Request
              </span>
            )}
          </Link>
        ))}
        {rows.length === 0 && (
          <p className="px-5 py-10 text-center text-sm text-muted">
            No conversations yet. Message someone from the directory to get started.
          </p>
        )}
      </div>
    </div>
  );
}
