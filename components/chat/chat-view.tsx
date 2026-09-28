"use client";

import { Fragment, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { PAGE_SIZE, confirmSend, fromRows, isNearBottom, optimistic, prependOlder, sendErrorMessage, setStatus, upsertMessage, type ThreadMessage } from "@/lib/chat";
import { ICEBREAKERS } from "@/lib/constants";
import { createClient, createRealtimeClient } from "@/lib/supabase/client";
import type { ChatMessage, MatchContact, MatchDetails } from "@/lib/types";
import { dayLabel, matchedLabel } from "@/lib/utils";
import { useVisualViewport } from "@/hooks/use-visual-viewport";
import { useInbox } from "@/components/layout/inbox-provider";
import { useToast } from "@/components/ui/toast";
import { IconButton, IconLink } from "@/components/ui/button";
import { GlowOrb } from "@/components/ui/glass-panel";
import { BackIcon, DotsIcon } from "@/components/ui/icons";
import { Avatar } from "@/components/ui/photo";
import { ChatBubble, DaySeparator } from "@/components/chat/chat-bubble";
import { ChatComposer } from "@/components/chat/chat-composer";
import { ConnectCard } from "@/components/chat/connect-card";
import { SafetySheet } from "@/components/chat/safety-sheet";
import { MatchProfileSheet } from "@/components/chat/match-profile-sheet";

type Props = {
  matchId: string;
  other: MatchContact;
  matchedAt: string | null;
  initialMessages: ChatMessage[];
  initialHasMore: boolean;
  /** Full profile for "View profile"; null when unavailable. */
  details: MatchDetails | null;
};

export function ChatView({ matchId, other, details, matchedAt, initialMessages, initialHasMore }: Props) {
  const supabase = useMemo(() => createClient(), []);
  const { viewer, refresh } = useInbox();
  const toast = useToast();
  const viewport = useVisualViewport();

  const [messages, setMessages] = useState<ThreadMessage[]>(() => fromRows(initialMessages));
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [ended, setEnded] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [atBottom, setAtBottom] = useState(true);
  const [readUpTo, setReadUpTo] = useState(initialMessages.length);

  const scrollRef = useRef<HTMLDivElement>(null);
  const nearBottom = useRef(true);
  const prevTail = useRef<string | number | undefined>(undefined);
  const restoreFrom = useRef<number | null>(null);
  const messagesRef = useRef(messages);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const scrollToBottom = useCallback((smooth = false) => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: smooth ? "smooth" : "auto" });
  }, []);

  const markRead = useCallback(async () => {
    if (document.visibilityState !== "visible" || !nearBottom.current) return;
    if (!messagesRef.current.some((m) => m.sender_id !== viewer.id && !m.read_at && m.status === "sent")) return;
    const { error } = await supabase.from("messages").update({ read_at: new Date().toISOString() }).eq("match_id", matchId).neq("sender_id", viewer.id).is("read_at", null);
    if (!error) void refresh();
  }, [matchId, refresh, supabase, viewer.id]);

  // Keep the reader pinned to the latest message only if they were already there (or just sent it).
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (restoreFrom.current !== null) {
      el.scrollTop = el.scrollHeight - restoreFrom.current;
      restoreFrom.current = null;
    }
    const last = messages.at(-1);
    const tail = last?.clientId ?? last?.id;
    if (tail === prevTail.current) return;
    const first = prevTail.current === undefined;
    prevTail.current = tail;
    if (first || last?.sender_id === viewer.id || nearBottom.current) scrollToBottom(!first);
  }, [messages, scrollToBottom, viewer.id]);

  useEffect(() => {
    void markRead();
  }, [messages, markRead]);

  // Keyboard open/close changes the viewport; stay on the latest message if the reader was there.
  useEffect(() => {
    if (nearBottom.current) scrollToBottom();
  }, [viewport?.height, scrollToBottom]);

  useEffect(() => {
    const onVisible = () => void markRead();
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [markRead]);

  // Realtime: RLS (is_active_match) scopes these events to participants of this active match.
  useEffect(() => {
    let cancelled = false;
    let cleanup = () => {};
    const catchUp = async () => {
      const lastSent = [...messagesRef.current].reverse().find((m) => m.status === "sent");
      let query = supabase.from("messages").select("id,match_id,sender_id,content,created_at,read_at").eq("match_id", matchId).order("created_at", { ascending: true }).limit(PAGE_SIZE);
      if (lastSent) query = query.gt("created_at", lastSent.created_at);
      const { data } = await query;
      if (data?.length) setMessages((list) => data.reduce((acc, row) => upsertMessage(acc, row as ChatMessage), list));
    };
    void createRealtimeClient().then((client) => {
      if (cancelled) return;
      const filter = `match_id=eq.${matchId}`;
      const channel = client
        .channel(`chat:${matchId}`)
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter }, (payload) => {
          setMessages((list) => upsertMessage(list, payload.new as ChatMessage));
        })
        .on("postgres_changes", { event: "UPDATE", schema: "public", table: "messages", filter }, (payload) => {
          const row = payload.new as ChatMessage;
          setMessages((list) => (list.some((m) => m.id === row.id) ? upsertMessage(list, row) : list));
        })
        .on("postgres_changes", { event: "UPDATE", schema: "public", table: "matches", filter: `id=eq.${matchId}` }, (payload) => {
          if ((payload.new as { status?: string }).status !== "ACTIVE") setEnded(true);
        })
        .subscribe((status) => {
          if (status === "SUBSCRIBED") void catchUp();
        });
      cleanup = () => void client.removeChannel(channel);
    });
    return () => {
      cancelled = true;
      cleanup();
    };
  }, [matchId, supabase]);

  const deliver = useCallback(
    async (clientId: string, content: string) => {
      const { data, error } = await supabase.from("messages").insert({ match_id: matchId, sender_id: viewer.id, content }).select("id,match_id,sender_id,content,created_at,read_at").single();
      if (error || !data) {
        setMessages((list) => setStatus(list, clientId, "failed"));
        if (error?.code === "42501") setEnded(true);
        toast({ tone: "error", message: sendErrorMessage(error) });
        return;
      }
      setMessages((list) => confirmSend(list, clientId, data as ChatMessage));
    },
    [matchId, supabase, toast, viewer.id],
  );

  const send = (content: string) => {
    const clientId = crypto.randomUUID();
    nearBottom.current = true;
    setMessages((list) => [...list, optimistic(matchId, viewer.id, content, clientId)]);
    void deliver(clientId, content);
  };

  const retry = (message: ThreadMessage) => {
    if (!message.clientId) return;
    setMessages((list) => setStatus(list, message.clientId!, "sending"));
    void deliver(message.clientId, message.content);
  };

  const loadOlder = async () => {
    const oldest = messages.find((m) => m.status === "sent");
    if (!oldest || loadingOlder) return;
    setLoadingOlder(true);
    const { data, error } = await supabase
      .from("messages")
      .select("id,match_id,sender_id,content,created_at,read_at")
      .eq("match_id", matchId)
      .lt("created_at", oldest.created_at)
      .order("created_at", { ascending: false })
      .limit(PAGE_SIZE);
    setLoadingOlder(false);
    if (error) return toast({ tone: "error", message: "Couldn’t load earlier messages." });
    const rows = ((data ?? []) as ChatMessage[]).reverse();
    const el = scrollRef.current;
    if (el) restoreFrom.current = el.scrollHeight - el.scrollTop;
    setHasMore(rows.length === PAGE_SIZE);
    setMessages((list) => prependOlder(list, rows));
    setReadUpTo((n) => n + rows.length);
  };

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const near = isNearBottom(el);
    nearBottom.current = near;
    if (near !== atBottom) setAtBottom(near);
    if (near) {
      if (readUpTo !== messages.length) setReadUpTo(messages.length);
      void markRead();
    }
  };

  const unseen = atBottom ? 0 : messages.slice(readUpTo).filter((m) => m.sender_id !== viewer.id).length;
  const lastMine = [...messages].reverse().find((m) => m.sender_id === viewer.id && m.status === "sent");
  const when = matchedLabel(matchedAt).replace(/^Matched ?/, "");

  return (
    <div
      className="fixed inset-x-0 top-0 isolate flex flex-col overflow-hidden bg-night lg:left-[260px]"
      style={{ height: viewport ? viewport.height : "100dvh", transform: viewport?.offsetTop ? `translateY(${viewport.offsetTop}px)` : undefined }}
    >
      <GlowOrb className="-bottom-15 -left-40 size-[440px]" />

      <div ref={scrollRef} onScroll={onScroll} className="no-scrollbar absolute inset-0 overflow-y-auto overscroll-contain px-4 pt-[calc(96px+env(safe-area-inset-top))] pb-[calc(104px+env(safe-area-inset-bottom))]">
        <div className="mx-auto flex max-w-[720px] flex-col">
          {hasMore ? (
            <button type="button" onClick={() => void loadOlder()} disabled={loadingOlder} className="mx-auto mb-2 h-11 rounded-full px-4 text-[13px] font-semibold text-ink/60 hover:bg-white/5 disabled:opacity-50">
              {loadingOlder ? "Loading…" : "Load earlier messages"}
            </button>
          ) : null}

          <section className="flex flex-col items-center gap-2.5 pt-[18px] pb-[22px] text-center">
            <div aria-hidden="true" className="flex">
              <Avatar path={viewer.photo} name={viewer.name} seed={viewer.id} size={60} className="border-[3px] border-night" />
              <Avatar path={other.photo} name={other.name} seed={other.profile_id} size={60} className="-ml-4 border-[3px] border-night" />
            </div>
            <p className="m-0 text-sm text-ink/55">
              You matched with {other.name}
              {when ? ` ${when}` : ""}
            </p>
            {details && !ended ? (
              <button type="button" onClick={() => setProfileOpen(true)} className="h-11 rounded-full border border-saffron/35 bg-saffron/8 px-5 text-sm font-bold text-saffron transition-colors hover:bg-saffron/14">
                View {other.name}&apos;s full profile
              </button>
            ) : null}
            {messages.length === 0 && !ended ? (
              <div className="mt-[18px] flex flex-col items-center gap-2.5">
                <h2 className="m-0 mb-1 text-[22px] font-extrabold tracking-[-0.02em]">
                  Break the <span className="serif text-[26px] text-saffron">ice</span>
                </h2>
                {ICEBREAKERS.map((line) => (
                  <button
                    key={line}
                    type="button"
                    onClick={() => send(line)}
                    className="h-11 rounded-full border border-white/9 bg-surface px-4 text-sm font-medium text-ink/86 transition-[background-color,border-color,transform] duration-150 hover:border-saffron/35 hover:bg-hover active:scale-[.96]"
                  >
                    {line}
                  </button>
                ))}
              </div>
            ) : null}
          </section>

          <ol role="log" aria-live="polite" aria-label={`Conversation with ${other.name}`} className="m-0 flex list-none flex-col gap-1.5 p-0">
            {messages.map((message, i) => {
              const prev = messages[i - 1];
              const next = messages[i + 1];
              const day = dayLabel(message.created_at);
              const newDay = !prev || dayLabel(prev.created_at) !== day;
              const last = !next || next.sender_id !== message.sender_id || dayLabel(next.created_at) !== day;
              const mine = message.sender_id === viewer.id;
              return (
                <Fragment key={message.clientId ?? message.id}>
                  {newDay ? <DaySeparator label={day} /> : null}
                  <ChatBubble message={message} mine={mine} last={last} seen={mine && message === lastMine && Boolean(message.read_at)} onRetry={() => retry(message)} />
                </Fragment>
              );
            })}
          </ol>

          {ended ? (
            <p role="status" className="mx-auto mt-6 rounded-full bg-white/4 px-4 py-2 text-[13px] text-ink/60">
              This conversation has ended.
            </p>
          ) : (
            <ConnectCard instagram={other.instagram_username} whatsapp={other.whatsapp_number} />
          )}
        </div>
      </div>

      <header className="glass pt-safe absolute inset-x-0 top-0 z-10 border-x-0 border-t-0 border-b border-white/6 bg-[rgba(8,8,10,.62)]">
        <div className="mx-auto flex h-[76px] max-w-[760px] items-center gap-1.5 px-2">
          <IconLink href="/messages" label="Back to chats" className="lg:hidden">
            <BackIcon />
          </IconLink>
          <h1 className="sr-only">Chat with {other.name}</h1>
          <button
            type="button"
            onClick={() => setProfileOpen(true)}
            disabled={!details || ended}
            aria-label={details && !ended ? `View ${other.name}'s profile` : undefined}
            className="flex min-h-11 min-w-0 flex-1 items-center gap-1.5 rounded-full pr-2 text-left enabled:hover:bg-white/4 disabled:cursor-default lg:ml-2"
          >
            <Avatar path={other.photo} name={other.name} seed={other.profile_id} size={40} />
            <span className="ml-1.5 flex min-w-0 flex-1 flex-col">
              <span aria-hidden="true" className="truncate text-base font-bold">{other.name}</span>
              <span className="text-xs text-ink/50">{ended ? "Conversation ended" : details ? `${matchedLabel(matchedAt)} · View profile` : matchedLabel(matchedAt)}</span>
            </span>
          </button>
          <IconButton label={`More options for ${other.name}`} tone="plain" className="text-ink/80" onClick={() => setSheetOpen(true)}>
            <DotsIcon size={20} />
          </IconButton>
        </div>
      </header>

      {unseen > 0 ? (
        <button
          type="button"
          onClick={() => scrollToBottom(true)}
          className="glass absolute bottom-[calc(92px+env(safe-area-inset-bottom))] left-1/2 z-10 h-10 -translate-x-1/2 animate-rise rounded-full px-4 text-[13px] font-bold text-saffron shadow-[0_10px_30px_rgba(0,0,0,.4)]"
        >
          {unseen} new {unseen === 1 ? "message" : "messages"} ↓
        </button>
      ) : null}

      <div className="absolute inset-x-3 bottom-[max(22px,calc(10px+env(safe-area-inset-bottom)))] z-10 mx-auto max-w-[720px]">
        <ChatComposer onSend={send} disabled={ended} onFocus={() => nearBottom.current && window.setTimeout(() => scrollToBottom(), 250)} />
      </div>

      {details ? <MatchProfileSheet open={profileOpen && !ended} onClose={() => setProfileOpen(false)} details={details} /> : null}
      <SafetySheet open={sheetOpen} onClose={() => setSheetOpen(false)} matchId={matchId} profileId={other.profile_id} name={other.name} />
    </div>
  );
}
