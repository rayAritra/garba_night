"use client";

import Link from "next/link";
import { eventPlace, eventTime, eventDate, eventTitle } from "@/lib/event";
import { useInbox } from "@/components/layout/inbox-provider";
import { SectionLabel } from "@/components/ui/glass-panel";
import { AvatarRing } from "@/components/ui/photo";

/** Right rail on wide desktop (DiscoverDesktop.html): fresh matches, the night, keyboard hints. */
export function DiscoverAside() {
  const { matches } = useInbox();
  const fresh = (matches ?? []).filter((m) => !m.latest_message).slice(0, 4);
  return (
    <aside className="hidden flex-col gap-10 px-8 py-9 xl:flex">
      <section className="flex flex-col gap-4">
        <SectionLabel>New matches</SectionLabel>
        {fresh.length ? (
          <ul className="m-0 flex list-none gap-3 p-0">
            {fresh.map((m, i) => (
              <li key={m.match_id}>
                <Link href={`/messages/${m.match_id}`} aria-label={`Message ${m.other_name}`} className="block rounded-full">
                  <AvatarRing path={m.other_photo} name={m.other_name} seed={m.other_profile_id} size={56} glow={i === 0} />
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="m-0 text-sm text-ink/50">Your mutual likes will show up here.</p>
        )}
      </section>
      <section className="flex flex-col gap-3.5 border-t border-white/6 pt-7">
        <SectionLabel>The night</SectionLabel>
        <p className="m-0 text-[22px] leading-tight font-extrabold tracking-[-0.02em]">{eventTitle}</p>
        <p className="m-0 text-sm leading-relaxed text-ink/60">
          {eventDate} · {eventTime}
          {eventPlace ? (
            <>
              <br />
              {eventPlace}
            </>
          ) : null}
        </p>
      </section>
      <section aria-label="Keyboard shortcuts" className="mt-auto flex flex-col gap-2.5 text-[13px] text-ink/50">
        <span className="flex items-center gap-2.5">
          <kbd className="kbd">←</kbd>Pass<span className="w-3" />
          <kbd className="kbd">→</kbd>Like
        </span>
        <span className="flex items-center gap-2.5">
          <kbd className="kbd">Space</kbd>Next photo
        </span>
      </section>
    </aside>
  );
}
