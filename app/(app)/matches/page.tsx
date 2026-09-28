import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import type { LikeReceived } from "@/lib/types";
import { GlowOrb } from "@/components/ui/glass-panel";
import { MatchesView } from "@/components/matches/inbox";

export const metadata: Metadata = { title: "Matches" };

export default async function MatchesPage() {
  const supabase = await createClient();
  // get_likes_received ships in migration 0003; without it the "Likes you" row is simply hidden.
  const { data, error } = await supabase.rpc("get_likes_received");

  return (
    <main className="pb-nav relative isolate mx-auto min-h-dvh max-w-[640px] overflow-hidden lg:pt-6">
      <GlowOrb color="rose" className="-top-40 -right-50 size-[460px]" />
      <header className="pt-safe px-5 lg:px-4">
        <h1 className="m-0 pt-6 text-[32px] font-extrabold tracking-[-0.035em]">Matches</h1>
      </header>
      <MatchesView initialLikes={error ? null : ((data ?? []) as LikeReceived[])} />
    </main>
  );
}
