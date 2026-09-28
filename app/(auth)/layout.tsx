import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/** Signed-in visitors skip the auth screens. */
export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/discover");
  return children;
}
