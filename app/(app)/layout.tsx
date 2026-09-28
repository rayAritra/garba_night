import { redirect } from "next/navigation";
import { getViewer } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";
import type { LikeReceived, MatchSummary } from "@/lib/types";
import { AppShell } from "@/components/layout/app-shell";
import { InboxProvider } from "@/components/layout/inbox-provider";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const viewer = await getViewer();
  if (!viewer.onboardingCompleted) redirect("/onboarding");

  const supabase = await createClient();
  const [matchesResult, likesResult] = await Promise.all([supabase.rpc("get_matches"), supabase.rpc("get_likes_received")]);
  const initial = matchesResult.error ? null : ((matchesResult.data ?? []) as MatchSummary[]).map((m) => ({ ...m, unread_count: Number(m.unread_count) }));
  // null = "Likes you" backend not installed yet (migrations 0003/0005); the row stays hidden.
  const initialLikes = likesResult.error ? null : ((likesResult.data ?? []) as LikeReceived[]);

  return (
    <InboxProvider viewer={{ id: viewer.id, name: viewer.name, photo: viewer.photos[0] ?? null }} initial={initial} initialLikes={initialLikes}>
      <AppShell>{children}</AppShell>
    </InboxProvider>
  );
}
