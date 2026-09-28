"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { createClient, createRealtimeClient } from "@/lib/supabase/client";
import type { MatchSummary } from "@/lib/types";
import { useToast } from "@/components/ui/toast";

export type Viewer = { id: string; name: string; photo: string | null };

type InboxValue = {
  viewer: Viewer;
  matches: MatchSummary[] | null;
  error: boolean;
  unreadTotal: number;
  refresh: () => Promise<void>;
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
 * One realtime subscription for the whole signed-in app. RLS limits `messages` and `matches`
 * events to the viewer's own conversations, so any event is simply a cue to re-run `get_matches`.
 */
export function InboxProvider({ viewer, initial, children }: { viewer: Viewer; initial: MatchSummary[] | null; children: ReactNode }) {
  const [matches, setMatches] = useState<MatchSummary[] | null>(initial);
  const [error, setError] = useState(false);
  const known = useRef(new Set((initial ?? []).map((m) => m.match_id)));
  const celebrated = useRef(new Set<string>());
  const primed = useRef(initial !== null);
  const timer = useRef<number | undefined>(undefined);
  const toast = useToast();
  const router = useRouter();

  const refresh = useCallback(async () => {
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

  const value = useMemo<InboxValue>(
    () => ({ viewer, matches, error, refresh, markCelebrated, unreadTotal: (matches ?? []).reduce((sum, m) => sum + (m.unread_count > 0 ? 1 : 0), 0) }),
    [viewer, matches, error, refresh, markCelebrated],
  );

  return <InboxContext.Provider value={value}>{children}</InboxContext.Provider>;
}
