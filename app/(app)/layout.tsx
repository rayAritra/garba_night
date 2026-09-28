import { redirect } from "next/navigation";
import { getViewer } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";
import type { MatchSummary } from "@/lib/types";
import { AppShell } from "@/components/layout/app-shell";
import { InboxProvider } from "@/components/layout/inbox-provider";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const viewer = await getViewer();
  if (!viewer.onboardingCompleted) redirect("/onboarding");

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_matches");
  const initial = error ? null : ((data ?? []) as MatchSummary[]).map((m) => ({ ...m, unread_count: Number(m.unread_count) }));

  return (
    <InboxProvider viewer={{ id: viewer.id, name: viewer.name, photo: viewer.photos[0] ?? null }} initial={initial}>
      <AppShell>{children}</AppShell>
    </InboxProvider>
  );
}
