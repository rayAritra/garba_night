import { createBrowserClient } from "@supabase/ssr";
export function createClient() {
  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
}

/**
 * Browser client whose realtime socket carries the user's JWT. Channels joined before the
 * session is applied connect as anon, and RLS then silently filters every postgres_changes event.
 */
export async function createRealtimeClient() {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (session) await supabase.realtime.setAuth(session.access_token);
  return supabase;
}
