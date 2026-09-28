import type { Metadata } from "next";
import { getViewer } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";
import { BATCH_SIZE } from "@/lib/swipe";
import type { DiscoverProfile } from "@/lib/types";
import { GlowOrb } from "@/components/ui/glass-panel";
import { DiscoverAside } from "@/components/discover/discover-aside";
import { DiscoverDeck } from "@/components/discover/discover-deck";

export const metadata: Metadata = { title: "Discover" };

export default async function DiscoverPage() {
  const [viewer, supabase] = await Promise.all([getViewer(), createClient()]);
  // First batch on the server so the first card paints with the page; the deck refills client-side.
  const { data, error } = await supabase.rpc("get_discover_profiles", { p_limit: BATCH_SIZE });

  return (
    <main className="relative isolate overflow-hidden xl:grid xl:grid-cols-[minmax(0,1fr)_340px]">
      <GlowOrb color="magenta" className="top-[220px] left-1/2 -ml-[260px] size-[520px] lg:top-[100px] lg:size-[900px] lg:-ml-[390px]" />
      <h1 className="sr-only">Discover</h1>
      <DiscoverDeck initial={error ? null : ((data ?? []) as DiscoverProfile[])} paused={!viewer.isActive} />
      <DiscoverAside />
    </main>
  );
}
