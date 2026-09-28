import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { INTERESTS } from "@/lib/constants";
import { getViewer } from "@/lib/profile";
import { draftFromProfile } from "@/lib/profile-draft";
import { createClient } from "@/lib/supabase/server";
import { OnboardingFlow } from "@/components/onboarding/onboarding-flow";

export const metadata: Metadata = { title: "Set up your profile" };

export default async function OnboardingPage() {
  const viewer = await getViewer();
  if (viewer.onboardingCompleted) redirect("/discover");
  const supabase = await createClient();
  const { data } = await supabase.from("interests").select("name").order("id");
  const catalog = data?.length ? data.map((row) => row.name as string) : [...INTERESTS];
  return <OnboardingFlow userId={viewer.id} initial={draftFromProfile(viewer)} catalog={catalog} />;
}
