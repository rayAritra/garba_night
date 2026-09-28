"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { profileSchema, signUpSchema } from "@/lib/validation";

export type ActionState = { error?: string; success?: string; fields?: { name?: string; email?: string } };

export async function signUp(_: ActionState, formData: FormData): Promise<ActionState> {
  const fields = { name: String(formData.get("name") ?? ""), email: String(formData.get("email") ?? "") };
  const parsed = signUpSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const field = issue?.path[0];
    const message = field === "password" ? "Use a password with at least 8 characters." : field === "email" ? "Enter a valid email." : field === "name" ? "Add your first name (2+ letters)." : "Check your details";
    return { error: message, fields };
  }
  const supabase = await createClient();
  const origin = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const { data, error } = await supabase.auth.signUp({ email: parsed.data.email, password: parsed.data.password, options: { data: { name: parsed.data.name }, emailRedirectTo: `${origin}/auth/callback?next=/onboarding` } });
  if (error) return { error: error.message, fields };
  if (!data.session) return { success: "Check your email, then tap the sign-in link to continue." };
  redirect("/onboarding");
}

export async function login(_: ActionState, formData: FormData): Promise<ActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: "Email or password is incorrect.", fields: { email } };
  const { data: profile } = await supabase.from("profiles").select("onboarding_completed").single();
  redirect(profile?.onboarding_completed ? "/discover" : "/onboarding");
}

export async function forgotPassword(_: ActionState, formData: FormData): Promise<ActionState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email.includes("@")) return { error: "Enter a valid email.", fields: { email } };
  const supabase = await createClient();
  const origin = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${origin}/auth/callback?next=/reset-password` });
  if (error) return { error: error.message, fields: { email } };
  return { success: "If that account exists, a reset link is on its way." };
}

export async function resetPassword(_: ActionState, formData: FormData): Promise<ActionState> {
  const password = String(formData.get("password") ?? "");
  if (password.length < 8) return { error: "Use at least 8 characters." };
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };
  redirect("/discover");
}

export async function logout() {
  const supabase = await createClient(); await supabase.auth.signOut(); redirect("/");
}

export async function saveProfile(payload: unknown, photos: string[]) {
  const parsed = profileSchema.safeParse(payload);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check your profile" };
  if (photos.length < 2 || photos.length > 3) return { error: "Add 2–3 photos." };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in again." };
  const p = parsed.data;
  const fields = { name:p.name, date_of_birth:p.dateOfBirth, gender:p.gender, interested_in:p.interestedIn, year:p.year, department:p.department || null, bio:p.bio, instagram_username:p.instagram || null, whatsapp_number:p.whatsapp || null, share_instagram:p.shareInstagram, share_whatsapp:p.shareWhatsapp, onboarding_completed:true };
  const { data: updated, error } = await supabase.from("profiles").update(fields).eq("id",user.id).select("id");
  if (error) return { error: error.message };
  // The sign-up trigger normally creates this row; if it's missing (e.g. deleted by hand), recreate it.
  if (!updated?.length) {
    const { error: insertError } = await supabase.from("profiles").insert({ id:user.id, ...fields });
    if (insertError) return { error: "Your profile record is missing. Ask the organiser to run migration 0004, then try again." };
  }
  const { data: interests, error: interestError } = await supabase.from("interests").select("id,name").in("name",p.interests);
  if (interestError) return { error: interestError.message };
  await supabase.from("profile_interests").delete().eq("profile_id",user.id);
  const { error: linkError } = await supabase.from("profile_interests").insert((interests ?? []).map((i) => ({ profile_id:user.id, interest_id:i.id })));
  if (linkError) return { error: linkError.message };
  await supabase.from("profile_photos").delete().eq("profile_id",user.id);
  const { error: photoError } = await supabase.from("profile_photos").insert(photos.map((storage_path, position) => ({ profile_id:user.id, storage_path, position })));
  if (photoError) return { error: photoError.message };
  revalidatePath("/profile"); return { ok:true };
}

export async function submitReport(reportedId: string, reason: string, details: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error:"Unauthorized" };
  const allowed = ["Fake profile","Inappropriate content","Harassment","Spam","Other"];
  if (!allowed.includes(reason) || details.length > 500) return { error:"Invalid report" };
  const { error } = await supabase.from("reports").insert({ reporter_id:user.id, reported_id:reportedId, reason, details:details || null });
  return error ? { error:error.message } : { ok:true };
}
