import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { OwnProfile } from "@/lib/types";

/** Loads the signed-in student's own profile once per request. Redirects to /login when signed out. */
export const getViewer = cache(async (): Promise<OwnProfile> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?error=session");

  const [{ data: profile }, { data: photos }, { data: interests }] = await Promise.all([
    supabase
      .from("profiles")
      .select("name,date_of_birth,gender,interested_in,year,department,bio,instagram_username,whatsapp_number,share_instagram,share_whatsapp,onboarding_completed,is_active")
      .eq("id", user.id)
      .single(),
    supabase.from("profile_photos").select("storage_path").eq("profile_id", user.id).order("position"),
    supabase.from("profile_interests").select("interests(name)").eq("profile_id", user.id),
  ]);

  return {
    id: user.id,
    email: user.email ?? "",
    name: profile?.name ?? (user.user_metadata?.name as string | undefined) ?? "",
    dateOfBirth: profile?.date_of_birth ?? null,
    gender: profile?.gender ?? null,
    interestedIn: profile?.interested_in ?? [],
    year: profile?.year ?? null,
    department: profile?.department ?? null,
    bio: profile?.bio ?? null,
    instagram: profile?.instagram_username ?? null,
    whatsapp: profile?.whatsapp_number ?? null,
    shareInstagram: profile?.share_instagram ?? false,
    shareWhatsapp: profile?.share_whatsapp ?? false,
    onboardingCompleted: profile?.onboarding_completed ?? false,
    isActive: profile?.is_active ?? true,
    photos: (photos ?? []).map((p) => p.storage_path),
    interests: (interests ?? [])
      .map((row) => {
        const rel = row.interests as unknown as { name: string } | { name: string }[] | null;
        return Array.isArray(rel) ? rel[0]?.name : rel?.name;
      })
      .filter((n): n is string => Boolean(n)),
  };
});
