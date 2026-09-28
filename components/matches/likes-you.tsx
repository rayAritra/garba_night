"use client";

import { useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import type { LikeReceived } from "@/lib/types";
import { useInbox } from "@/components/layout/inbox-provider";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { SectionLabel } from "@/components/ui/glass-panel";
import { CloseIcon, LikeIcon } from "@/components/ui/icons";
import { AvatarRing } from "@/components/ui/photo";
import { useToast } from "@/components/ui/toast";
import { ProfileCard } from "@/components/discover/profile-card";
import { MatchModal } from "@/components/discover/match-modal";

/**
 * "Likes you": one-way likes waiting for an answer. Liking back goes through the same `submit_swipe`
 * as Discover, so the backend still decides the match; passing simply removes them from the row.
 */
export function LikesYou() {
  const { viewer, markCelebrated, refresh, likes: likesOrNull, removeLike } = useInbox();
  const likes = likesOrNull ?? [];
  const toast = useToast();
  const [open, setOpen] = useState<LikeReceived | null>(null);
  const [photo, setPhoto] = useState(0);
  const [match, setMatch] = useState<{ matchId: string; profile: LikeReceived } | null>(null);
  const [pending, startTransition] = useTransition();

  // Backend function not installed yet: hide the row entirely rather than show a misleading "no likes".
  if (likesOrNull === null) return null;

  const answer = (person: LikeReceived, direction: "LIKE" | "PASS") =>
    startTransition(async () => {
      const { data, error } = await createClient().rpc("submit_swipe", { p_target: person.id, p_direction: direction });
      // 23505 = already answered (e.g. from Discover in another tab); either way they leave this row.
      if (error && error.code !== "23505" && !error.message.includes("Profile unavailable")) {
        toast({ tone: "error", message: "Couldn’t save that. Try again." });
        return;
      }
      setOpen(null);
      removeLike(person.id);
      if (typeof data === "string" && data) {
        markCelebrated(data);
        setMatch({ matchId: data, profile: person });
        void refresh();
      }
    });

  return (
    <>
      <section aria-labelledby="likes-h" className="mt-6">
        <SectionLabel id="likes-h" className="mx-5 mb-3.5 text-[13px] text-saffron/80 lg:mx-4">
          Likes you{likes.length ? ` · ${likes.length}` : ""}
        </SectionLabel>
        {likes.length ? (
          <ul className="no-scrollbar m-0 flex list-none gap-4 overflow-x-auto px-5 pb-1 lg:px-4">
            {likes.map((person) => (
              <li key={person.id} className="w-[72px] shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setPhoto(0);
                    setOpen(person);
                  }}
                  aria-label={`${person.name} likes you. View profile`}
                  className="flex w-full flex-col items-center gap-2 rounded-lg"
                >
                  <AvatarRing path={person.photos[0]} name={person.name} seed={person.id} glow />
                  <span className="max-w-full truncate text-[13px] font-semibold text-ink/90">{person.name}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mx-5 my-0 flex items-center gap-3 rounded-[18px] border border-dashed border-white/10 px-4 py-3.5 text-sm text-ink/50 lg:mx-4">
            <LikeIcon size={18} className="shrink-0 text-saffron/60" />
            No likes yet. When someone likes you, they’ll show up here right away.
          </p>
        )}
      </section>

      <BottomSheet open={Boolean(open)} onClose={() => setOpen(null)} title={open ? `${open.name} likes you` : ""}>
        {open ? (
          <div className="flex flex-col gap-3 px-3 pb-1">
            <div className="relative h-[min(480px,56dvh)]">
              <ProfileCard profile={open} photoIndex={photo} onSelectPhoto={setPhoto} priority compact />
            </div>
            <div className="flex gap-2.5">
              <Button variant="secondary" size="md" className="flex-1" disabled={pending} onClick={() => answer(open, "PASS")}>
                <CloseIcon size={18} />
                Pass
              </Button>
              <Button size="md" className="flex-1" loading={pending} onClick={() => answer(open, "LIKE")}>
                {pending ? null : <LikeIcon size={18} />}
                Like back
              </Button>
            </div>
          </div>
        ) : null}
      </BottomSheet>

      {match ? (
        <MatchModal
          matchId={match.matchId}
          me={{ id: viewer.id, name: viewer.name, photo: viewer.photo }}
          them={{ id: match.profile.id, name: match.profile.name, photo: match.profile.photos[0] ?? null }}
          onClose={() => setMatch(null)}
        />
      ) : null}
    </>
  );
}
