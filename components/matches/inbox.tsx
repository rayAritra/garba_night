"use client";

import Link from "next/link";
import type { MatchSummary } from "@/lib/types";
import { LikesYou } from "@/components/matches/likes-you";
import { cn, shortStamp } from "@/lib/utils";
import { useInbox } from "@/components/layout/inbox-provider";
import { Button, ButtonLink } from "@/components/ui/button";
import { SectionLabel } from "@/components/ui/glass-panel";
import { HeartIcon } from "@/components/ui/icons";
import { Avatar, AvatarRing } from "@/components/ui/photo";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/states";

function ConversationRow({ match }: { match: MatchSummary }) {
  const unread = match.unread_count > 0;
  const stamp = match.latest_message_at ?? match.matched_at;
  return (
    <li>
      <Link
        href={`/messages/${match.match_id}`}
        className="flex items-center gap-3.5 px-5 py-3 no-underline transition-colors hover:bg-white/3 focus-visible:outline-offset-[-2px] lg:rounded-md lg:px-4"
      >
        <Avatar path={match.other_photo} name={match.other_name} seed={match.other_profile_id} size={56} />
        <span className="flex min-w-0 flex-1 flex-col gap-[3px]">
          <span className="flex items-baseline justify-between gap-2">
            <span className={cn("text-base", unread ? "font-bold" : "font-semibold")}>{match.other_name}</span>
            <time dateTime={stamp} className={cn("shrink-0 text-xs", unread ? "text-saffron" : "text-ink/40")}>
              {shortStamp(stamp)}
            </time>
          </span>
          <span className="flex items-center gap-2">
            <span className={cn("min-w-0 flex-1 truncate text-sm", unread ? "text-ink/88" : "text-ink/50")}>{match.latest_message ?? "New match — say hi"}</span>
            {unread ? (
              <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-saffron px-1.5 text-[11px] font-bold text-on-accent shadow-[0_0_10px_rgba(255,181,71,.6)]">
                {match.unread_count > 9 ? "9+" : match.unread_count}
                <span className="sr-only"> unread</span>
              </span>
            ) : null}
          </span>
        </span>
      </Link>
    </li>
  );
}

function ListSkeleton() {
  return (
    <div aria-hidden="true" className="flex flex-col">
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className="flex items-center gap-3.5 px-5 py-3">
          <Skeleton className="size-14 rounded-full" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3.5 w-48" />
          </div>
        </div>
      ))}
    </div>
  );
}

function useInboxState() {
  const inbox = useInbox();
  const retry = (
    <Button variant="secondary" size="md" onClick={() => void inbox.refresh()}>
      Try again
    </Button>
  );
  return { ...inbox, retry };
}

/** Matches.html: fresh matches as rings, then conversations. */
export function MatchesView() {
  const { matches, error, retry, likes: likesOrNull } = useInboxState();
  const likes = likesOrNull ?? [];
  const likesRow = <LikesYou />;

  if (!matches) return error ? <ErrorState className="mt-24" action={retry} /> : <ListSkeleton />;
  if (!matches.length) {
    return (
      <>
        {likesRow}
        <EmptyState
          className="mt-20"
          icon={<HeartIcon size={30} />}
          title={likes.length ? "Like them back?" : "No matches yet."}
          body={likes.length ? "Tap someone above to see their card. Like them back and it’s a match." : "When someone you liked likes you back, they’ll show up here."}
          action={likes.length ? undefined : <ButtonLink href="/discover" size="md">Start discovering</ButtonLink>}
        />
      </>
    );
  }
  const fresh = matches.filter((m) => !m.latest_message);
  const talking = matches.filter((m) => m.latest_message);
  return (
    <>
      {likesRow}
      {fresh.length ? (
        <section aria-labelledby="new-h" className="mt-6">
          <SectionLabel id="new-h" className="mx-5 mb-3.5 text-[13px] lg:mx-4">
            New · {fresh.length}
          </SectionLabel>
          <ul className="no-scrollbar m-0 flex list-none gap-4 overflow-x-auto px-5 pb-1 lg:px-4">
            {/* get_matches is newest-first: the freshest matches glow, older ones get a quiet ring. */}
            {fresh.map((m, i) => (
              <li key={m.match_id} className="w-[72px] shrink-0">
                <Link href={`/messages/${m.match_id}`} className="flex flex-col items-center gap-2 rounded-lg no-underline">
                  <AvatarRing path={m.other_photo} name={m.other_name} seed={m.other_profile_id} variant={i < 3 ? "warm" : "quiet"} glow={i < 2} />
                  <span className="max-w-full truncate text-[13px] font-semibold text-ink/90">{m.other_name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      <section aria-labelledby="msg-h" className="mt-7">
        <SectionLabel id="msg-h" className="mx-5 mb-1.5 text-[13px] lg:mx-4">
          Messages
        </SectionLabel>
        {talking.length ? (
          <ul className="m-0 list-none p-0">
            {talking.map((m) => (
              <ConversationRow key={m.match_id} match={m} />
            ))}
          </ul>
        ) : (
          <p className="mx-5 mt-2 text-sm text-ink/50 lg:mx-4">No conversations yet. Tap a new match to break the ice.</p>
        )}
      </section>
    </>
  );
}

/** Chats tab: every active conversation, most recent first. */
export function ChatsView() {
  const { matches, error, retry } = useInboxState();
  if (!matches) return error ? <ErrorState className="mt-24" action={retry} /> : <ListSkeleton />;
  if (!matches.length) {
    return (
      <EmptyState
        className="mt-20"
        title="No chats yet."
        body="Match with someone and your conversations will live here."
        action={<ButtonLink href="/discover" size="md">Find your match</ButtonLink>}
      />
    );
  }
  return (
    <ul className="m-0 mt-4 list-none p-0">
      {matches.map((m) => (
        <ConversationRow key={m.match_id} match={m} />
      ))}
    </ul>
  );
}
