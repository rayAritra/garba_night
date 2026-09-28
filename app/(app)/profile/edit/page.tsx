import type { Metadata } from "next";
import { INTERESTS } from "@/lib/constants";
import { getViewer } from "@/lib/profile";
import { draftFromProfile } from "@/lib/profile-draft";
import { createClient } from "@/lib/supabase/server";
import { ProfileEditor } from "@/components/profile/profile-editor";

export const metadata: Metadata = { title: "Edit profile" };

export default async function EditProfilePage() {
  const [viewer, supabase] = await Promise.all([getViewer(), createClient()]);
  const { data } = await supabase.from("interests").select("name").order("id");
  const catalog = data?.length ? data.map((row) => row.name as string) : [...INTERESTS];
  return <ProfileEditor userId={viewer.id} initial={draftFromProfile(viewer)} catalog={catalog} />;
}
