import type { Metadata } from "next";
import { PAGE_SIZE } from "@/lib/chat";
import { createClient } from "@/lib/supabase/server";
import type { ChatMessage, MatchContact, MatchDetails } from "@/lib/types";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/states";
import { ChatView } from "@/components/chat/chat-view";

export const metadata: Metadata = { title: "Chat" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function Unavailable() {
  return (
    <main className="pb-nav flex min-h-dvh items-center justify-center">
      <EmptyState
        title="This chat isn’t available."
        body="The match may have ended, or the link is wrong."
        action={<ButtonLink href="/messages" size="md" variant="secondary">Back to chats</ButtonLink>}
      />
    </main>
  );
}

export default async function ConversationPage({ params }: PageProps<"/messages/[matchId]">) {
  const { matchId } = await params;
  if (!UUID.test(matchId)) return <Unavailable />;

  const supabase = await createClient();
  // get_match_profile returns a row only for a participant of an active, unblocked match,
  // and each social handle only if its owner chose to share it.
  const [{ data: contact }, { data: rows }, { data: match }, { data: full }] = await Promise.all([
    supabase.rpc("get_match_profile", { p_match: matchId }),
    supabase.from("messages").select("id,match_id,sender_id,content,created_at,read_at").eq("match_id", matchId).order("created_at", { ascending: false }).limit(PAGE_SIZE),
    supabase.from("matches").select("matched_at").eq("id", matchId).maybeSingle(),
    // Full profile for "View profile" (migration 0007). Same match/block guards; null if not installed.
    supabase.rpc("get_match_details", { p_match: matchId }),
  ]);

  const other = (contact as MatchContact[] | null)?.[0];
  if (!other) return <Unavailable />;
  const details = (full as MatchDetails[] | null)?.[0] ?? null;

  const messages = ((rows ?? []) as ChatMessage[]).reverse();
  return (
    <ChatView key={matchId} matchId={matchId} other={other} details={details} matchedAt={match?.matched_at ?? null} initialMessages={messages} initialHasMore={messages.length === PAGE_SIZE} />
  );
}
