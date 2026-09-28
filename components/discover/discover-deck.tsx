"use client";

import Link from "next/link";
import { animate, motion, useMotionValue, useReducedMotion, useTransform, type PanInfo } from "motion/react";
import { useCallback, useEffect, useEffectEvent, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { DiscoverProfile } from "@/lib/types";
import { BATCH_SIZE, REFILL_AT, decideSwipe, dragProgress, mergeBatch, photoAfterTap, rotationFor, type SwipeDecision } from "@/lib/swipe";
import { useInbox } from "@/components/layout/inbox-provider";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Wordmark } from "@/components/ui/glass-panel";
import { CloseIcon, LikeIcon, SlidersIcon } from "@/components/ui/icons";
import { Photo, prefetchPhoto } from "@/components/ui/photo";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/states";
import { CARD_SIZES, ProfileCard, metaLine } from "@/components/discover/profile-card";
import { MatchModal } from "@/components/discover/match-modal";

type Status = "idle" | "loading" | "error" | "exhausted";

const actionClass =
  "glass flex items-center justify-center rounded-full transition-[transform,box-shadow] duration-150 hover:-translate-y-0.5 active:scale-[.92] disabled:pointer-events-none disabled:opacity-40";

export function DiscoverDeck({ initial, paused }: { initial: DiscoverProfile[] | null; paused: boolean }) {
  const supabase = useMemo(() => createClient(), []);
  const { viewer, markCelebrated } = useInbox();
  const toast = useToast();
  const reduceMotion = useReducedMotion();

  const [queue, setQueue] = useState<DiscoverProfile[]>(initial ?? []);
  // A failed server fetch starts in "error" with a retry button; refills are triggered by swipes, not effects.
  const [status, setStatus] = useState<Status>(initial === null ? "error" : initial.length ? "idle" : "exhausted");
  const statusRef = useRef(status);
  useEffect(() => {
    statusRef.current = status;
  }, [status]);
  const [photo, setPhoto] = useState(0);
  const [match, setMatch] = useState<{ matchId: string; profile: DiscoverProfile } | null>(null);

  const seen = useRef(new Set<string>());
  const pending = useRef(new Set<Promise<void>>());
  const fetching = useRef(false);
  const flying = useRef(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const x = useMotionValue(0);
  const rotate = useTransform(x, rotationFor);
  const likeOpacity = useTransform(x, (v) => (v > 0 ? dragProgress(v) : 0));
  const passOpacity = useTransform(x, (v) => (v < 0 ? dragProgress(v) : 0));
  const nextScale = useTransform(x, (v) => 0.94 + dragProgress(v) * 0.06);
  const nextY = useTransform(x, (v) => 14 - dragProgress(v) * 14);
  const nextOpacity = useTransform(x, (v) => 0.55 + dragProgress(v) * 0.45);

  const top = queue[0];
  const next = queue[1];
  const queueRef = useRef(queue);
  useEffect(() => {
    queueRef.current = queue;
  }, [queue]);

  // Each new top card starts centred. Layout effect = before paint, so the departed card never flashes back.
  useLayoutEffect(() => {
    x.set(0);
  }, [top?.id, x]);

  const fetchMore = useCallback(async () => {
    if (fetching.current) return;
    fetching.current = true;
    // Let in-flight swipes land first so the server doesn't hand those people back.
    await Promise.allSettled([...pending.current]);
    const { data, error } = await supabase.rpc("get_discover_profiles", { p_limit: BATCH_SIZE });
    fetching.current = false;
    if (error) {
      setStatus("error");
      return;
    }
    const batch = (data ?? []) as DiscoverProfile[];
    const added = mergeBatch(queueRef.current, batch, seen.current).length > queueRef.current.length;
    setQueue((current) => mergeBatch(current, batch, seen.current));
    setStatus(added ? "idle" : "exhausted");
  }, [supabase]);

  // Prefetch: the rest of this card's photos, all of the next card's, and the lead photo of the two after.
  useEffect(() => {
    queue[0]?.photos.slice(1).forEach((p) => prefetchPhoto(p, CARD_SIZES));
    queue[1]?.photos.forEach((p) => prefetchPhoto(p, CARD_SIZES));
    queue.slice(2, 4).forEach((p) => prefetchPhoto(p.photos[0], CARD_SIZES));
  }, [queue]);

  const commit = useCallback(
    (decision: SwipeDecision, card: DiscoverProfile) => {
      seen.current.add(card.id);
      setQueue((current) => current.filter((p) => p.id !== card.id));
      setPhoto(0);
      // Refill while a few cards remain so the deck never visibly runs dry mid-swipe.
      const remaining = queueRef.current.filter((p) => p.id !== card.id).length;
      if (remaining <= REFILL_AT && statusRef.current === "idle") void fetchMore();
      const request = (async () => {
        const { data, error } = await supabase.rpc("submit_swipe", { p_target: card.id, p_direction: decision });
        if (error) {
          // Already swiped (e.g. another tab) or the person became unavailable: nothing to restore.
          if (error.code === "23505" || error.message.includes("Profile unavailable")) return;
          seen.current.delete(card.id);
          setQueue((current) => [card, ...current.filter((p) => p.id !== card.id)]);
          toast({ tone: "error", message: `Couldn’t save that. ${card.name} is back on top — try again.` });
          return;
        }
        // The backend decides mutuality; a returned id is the only thing that opens the reveal.
        if (typeof data === "string" && data) {
          markCelebrated(data);
          setMatch({ matchId: data, profile: card });
        }
      })();
      pending.current.add(request);
      void request.finally(() => pending.current.delete(request));
    },
    [fetchMore, markCelebrated, supabase, toast],
  );

  const swipe = useCallback(
    async (decision: SwipeDecision, velocity = 0) => {
      const card = queue[0];
      if (!card || flying.current) return;
      flying.current = true;
      const direction = decision === "LIKE" ? 1 : -1;
      const distance = direction * (window.innerWidth / 2 + 480);
      await animate(
        x,
        distance,
        reduceMotion
          ? { duration: 0 }
          : velocity
            ? { type: "spring", velocity, stiffness: 240, damping: 30, restDelta: 40, restSpeed: 600 }
            : { duration: 0.28, ease: [0.2, 0.8, 0.2, 1] },
      );
      flying.current = false;
      commit(decision, card);
    },
    [commit, queue, reduceMotion, x],
  );

  const onDragEnd = (_: unknown, info: PanInfo) => {
    const decision = decideSwipe(info.offset.x, info.velocity.x);
    if (decision) void swipe(decision, info.velocity.x);
    else void animate(x, 0, reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 520, damping: 32 });
  };

  const onTap = (event: MouseEvent | TouchEvent | PointerEvent, info: { point: { x: number } }) => {
    if ((event.target as HTMLElement | null)?.closest("button")) return;
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect || !top) return;
    setPhoto((current) => photoAfterTap(current, top.photos.length, info.point.x - window.scrollX - rect.left, rect.width));
  };

  const onKey = useEffectEvent((event: KeyboardEvent) => {
    if (match || !top || event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return;
    const target = event.target as HTMLElement;
    if (target.closest("input, textarea, select, [contenteditable='true'], dialog")) return;
    if (event.key === "ArrowRight") {
      event.preventDefault();
      void swipe("LIKE");
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      void swipe("PASS");
    } else if (event.key === " " && (target === document.body || target === cardRef.current)) {
      event.preventDefault();
      setPhoto((current) => (top.photos.length ? (current + 1) % top.photos.length : 0));
    }
  });

  useEffect(() => {
    const handler = (event: KeyboardEvent) => onKey(event);
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const retry = () => {
    setStatus("loading");
    void fetchMore();
  };

  return (
    <div className="pb-nav flex h-dvh flex-col lg:pb-8">
      <header className="pt-safe flex h-[60px] shrink-0 items-center justify-between pr-4 pl-5 lg:hidden">
        <Wordmark />
        <Link href="/settings#discovery" aria-label="Discovery preferences" className="glass flex size-11 items-center justify-center rounded-full text-ink">
          <SlidersIcon size={18} />
        </Link>
      </header>

      {paused ? (
        <p className="mx-4 mb-2 rounded-md border border-saffron/25 bg-saffron/8 px-4 py-3 text-[13px] leading-snug text-saffron-soft lg:mx-auto lg:mt-6 lg:w-[460px]">
          Discovery is paused — nobody new sees your card.{" "}
          <Link href="/settings#discovery" className="font-bold text-saffron underline-offset-2 hover:underline">
            Resume in settings
          </Link>
        </p>
      ) : null}

      <p className="sr-only" aria-live="polite">
        {top ? `${top.name}${top.age ? `, ${top.age}` : ""}. ${metaLine(top)}` : ""}
      </p>

      <div className="relative flex min-h-0 flex-1 flex-col items-center px-4 pt-1 lg:justify-center lg:gap-[22px] lg:pt-8">
        <div className="relative w-full max-w-[460px] flex-1 lg:max-h-[700px] lg:w-[460px]">
          {top ? (
            <>
              {next ? (
                <motion.div aria-hidden="true" className="absolute inset-0 origin-bottom overflow-hidden rounded-card border border-white/6" style={{ scale: nextScale, y: nextY, opacity: nextOpacity }}>
                  <Photo path={next.photos[0]} alt="" seed={next.id} sizes={CARD_SIZES} className="text-7xl" />
                  <div className="absolute inset-0 bg-night/35" />
                </motion.div>
              ) : null}
              <motion.article
                key={top.id}
                ref={cardRef}
                tabIndex={-1}
                aria-label={`${top.name}${top.age ? `, ${top.age}` : ""}`}
                aria-roledescription="profile card"
                className="absolute inset-0 cursor-grab touch-pan-y rounded-card shadow-[0_30px_70px_rgba(0,0,0,.6)] outline-none select-none active:cursor-grabbing lg:rotate-0"
                style={{ x, rotate }}
                drag="x"
                dragMomentum={false}
                onDragEnd={onDragEnd}
                onTap={onTap}
                initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
              >
                <ProfileCard
                  profile={top}
                  photoIndex={photo}
                  onSelectPhoto={setPhoto}
                  priority
                  overlay={
                    <>
                      <motion.div aria-hidden="true" style={{ opacity: likeOpacity }} className="absolute top-11 left-[22px] z-10 -rotate-10 rounded-sm border-2 border-saffron px-3.5 py-1.5 text-[22px] font-extrabold tracking-[0.06em] text-saffron">
                        VIBE
                      </motion.div>
                      <motion.div aria-hidden="true" style={{ opacity: passOpacity }} className="absolute top-11 right-[22px] z-10 rotate-10 rounded-sm border-2 border-ink/80 px-3.5 py-1.5 text-[22px] font-extrabold tracking-[0.06em] text-ink/90">
                        PASS
                      </motion.div>
                    </>
                  }
                />
              </motion.article>
            </>
          ) : status === "exhausted" ? (
            <div className="flex h-full items-center justify-center">
              <EmptyState
                title="You’ve caught up."
                body="More people are joining the dance floor. Check back soon."
                action={
                  <Button variant="secondary" size="md" onClick={retry}>
                    Check again
                  </Button>
                }
              />
            </div>
          ) : status === "error" ? (
            <div className="flex h-full items-center justify-center">
              <ErrorState
                body="We couldn’t load new people. Check your connection and try again."
                action={
                  <Button variant="secondary" size="md" onClick={retry}>
                    Try again
                  </Button>
                }
              />
            </div>
          ) : (
            <Skeleton className="absolute inset-0 rounded-card" />
          )}
        </div>

        {top ? (
          <div className="flex shrink-0 items-center justify-center gap-[22px] pt-3 lg:gap-6 lg:pt-0">
            <button type="button" aria-label={`Pass on ${top.name}`} onClick={() => void swipe("PASS")} className={`${actionClass} size-15 text-ink/85 lg:size-16`}>
              <CloseIcon size={22} />
            </button>
            <button
              type="button"
              aria-label={`Like ${top.name}`}
              onClick={() => void swipe("LIKE")}
              className={`${actionClass} size-[72px] border-saffron/35 text-saffron shadow-[0_0_40px_rgba(245,140,40,.28),inset_0_0_20px_rgba(255,181,71,.12)] lg:size-[76px]`}
            >
              <LikeIcon size={28} />
            </button>
          </div>
        ) : null}
      </div>

      {match ? (
        <MatchModal
          matchId={match.matchId}
          me={{ id: viewer.id, name: viewer.name, photo: viewer.photo }}
          them={{ id: match.profile.id, name: match.profile.name, photo: match.profile.photos[0] ?? null }}
          onClose={() => setMatch(null)}
        />
      ) : null}
    </div>
  );
}
