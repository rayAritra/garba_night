import type { Metadata } from "next";
import { getViewer } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";
import { SettingsView, type BlockedProfile } from "@/components/profile/settings-view";

export const metadata: Metadata = { title: "Settings" };

async function loadBlocked(userId: string): Promise<BlockedProfile[]> {
  const supabase = await createClient();
  // get_blocked_profiles ships in migration 0002; fall back to the caller's own block rows without it.
  const named = await supabase.rpc("get_blocked_profiles");
  if (!named.error) return ((named.data ?? []) as { id: string; name: string }[]).map((b) => ({ id: b.id, name: b.name }));
  const { data } = await supabase.from("blocks").select("blocked_id").eq("blocker_id", userId).order("created_at", { ascending: false });
  return (data ?? []).map((b) => ({ id: b.blocked_id as string, name: null }));
}

export default async function SettingsPage() {
  const viewer = await getViewer();
  const blocked = await loadBlocked(viewer.id);
  return (
    <SettingsView
      userId={viewer.id}
      email={viewer.email}
      isActive={viewer.isActive}
      instagram={viewer.instagram}
      whatsapp={viewer.whatsapp}
      shareInstagram={viewer.shareInstagram}
      shareWhatsapp={viewer.shareWhatsapp}
      photos={viewer.photos}
      blocked={blocked}
    />
  );
}
