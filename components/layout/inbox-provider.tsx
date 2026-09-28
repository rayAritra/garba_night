"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { createClient, createRealtimeClient } from "@/lib/supabase/client";
import type { LikeReceived, MatchSummary } from "@/lib/types";
import { useToast } from "@/components/ui/toast";

export type Viewer = { id: string; name: string; photo: string | null };

type InboxValue = {
  viewer: Viewer;
  matches: MatchSummary[] | null;
  error: boolean;
  unreadTotal: number;
  /** People who liked the viewer and await an answer. `null` when the backend function isn't installed. */
  likes: LikeReceived[] | null;
  refresh: () => Promise<void>;
  /** Drop someone from "Likes you" once the viewer has answered them. */
  removeLike: (profileId: string) => void;
  /** Discover calls this for matches it celebrates itself, so no duplicate "new match" toast fires. */
  markCelebrated: (matchId: string) => void;
};

const InboxContext = createContext<InboxValue | null>(null);

export function useInbox() {
  const value = useContext(InboxContext);
  if (!value) throw new Error("useInbox must be used inside <InboxProvider>");
  return value;
}

/**
 * One realtime subscription for the whole signed-in app. RLS limits `messages`, `matches` and `swipes`
 * events to the viewer's own conversations and likes aimed at them, so any event is simply a cue to
 * re-run `get_matches` / `get_likes_received`.
 */
export function InboxProvider({
  viewer,
  initial,
  initialLikes,
  children,
}: {
  viewer: Viewer;
  initial: MatchSummary[] | null;
  initialLikes: LikeReceived[] | null;
  children: ReactNode;
}) {
  const [matches, setMatches] = useState<MatchSummary[] | null>(initial);
  const [likes, setLikes] = useState<LikeReceived[] | null>(initialLikes);
  const [error, setError] = useState(false);
  const known = useRef(new Set((initial ?? []).map((m) => m.match_id)));
  const knownLikes = useRef(new Set((initialLikes ?? []).map((l) => l.id)));
  const celebrated = useRef(new Set<string>());
  const primed = useRef(initial !== null);
  const timer = useRef<number | undefined>(undefined);
  const toast = useToast();
  const router = useRouter();

  const refreshMatches = useCallback(async () => {
    const { data, error: rpcError } = await createClient().rpc("get_matches");
    if (rpcError) {
      setError(true);
      return;
    }
    const list = ((data ?? []) as MatchSummary[]).map((m) => ({ ...m, unread_count: Number(m.unread_count) }));
    // The very first load only establishes a baseline; only matches that appear later are "new".
    const fresh = primed.current ? list.filter((m) => !known.current.has(m.match_id) && !celebrated.current.has(m.match_id)) : [];
    primed.current = true;
    known.current = new Set(list.map((m) => m.match_id));
    setError(false);
    setMatches(list);
    for (const match of fresh) {
      toast({ message: `It's mutual — you matched with ${match.other_name}.`, action: { label: "Say hi", onClick: () => router.push(`/messages/${match.match_id}`) } });
    }
  }, [router, toast]);

  const refreshLikes = useCallback(async () => {
    const { data, error: rpcError } = await createClient().rpc("get_likes_received");
    if (rpcError) return; // function not installed yet (migration 0003/0005): keep the row hidden
    const list = (data ?? []) as LikeReceived[];
    const fresh = list.filter((l) => !knownLikes.current.has(l.id));
    knownLikes.current = new Set(list.map((l) => l.id));
    setLikes(list);
    if (fresh.length) {
      const who = fresh.length === 1 ? fresh[0].name : `${fresh.length} people`;
      toast({ message: `${who} liked you.`, action: { label: "See who", onClick: () => router.push("/matches") } });
    }
  }, [router, toast]);

  const refresh = useCallback(async () => {
    await Promise.all([refreshMatches(), refreshLikes()]);
  }, [refreshMatches, refreshLikes]);

  useEffect(() => {
    let cancelled = false;
    let cleanup = () => {};
    const debounced = () => {
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => void refresh(), 250);
    };
    if (!primed.current) debounced();
    void createRealtimeClient().then((supabase) => {
      if (cancelled) return;
      const channel = supabase
        .channel(`inbox:${viewer.id}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, debounced)
        .on("postgres_changes", { event: "*", schema: "public", table: "matches" }, debounced)
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "swipes", filter: `target_id=eq.${viewer.id}` }, debounced)
        .subscribe((status) => {
          // Catch up on anything missed while the socket was reconnecting.
          if (status === "SUBSCRIBED") debounced();
        });
      cleanup = () => void supabase.removeChannel(channel);
    });
    const onVisible = () => {
      if (document.visibilityState === "visible") debounced();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      window.clearTimeout(timer.current);
      document.removeEventListener("visibilitychange", onVisible);
      cleanup();
    };
  }, [refresh, viewer.id]);

  const markCelebrated = useCallback((matchId: string) => {
    celebrated.current.add(matchId);
    known.current.add(matchId);
  }, []);

  const removeLike = useCallback((profileId: string) => {
    setLikes((list) => (list ? list.filter((l) => l.id !== profileId) : list));
  }, []);

  const value = useMemo<InboxValue>(
    () => ({
      viewer,
      matches,
      likes,
      error,
      refresh,
      removeLike,
      markCelebrated,
      unreadTotal: (matches ?? []).reduce((sum, m) => sum + (m.unread_count > 0 ? 1 : 0), 0),
    }),
    [viewer, matches, likes, error, refresh, removeLike, markCelebrated],
  );

  return <InboxContext.Provider value={value}>{children}</InboxContext.Provider>;
}
