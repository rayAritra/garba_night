"use client";

import { useState } from "react";
import type { MatchDetails } from "@/lib/types";
import { photoAfterTap } from "@/lib/swipe";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Tag } from "@/components/ui/chip";
import { SectionLabel } from "@/components/ui/glass-panel";
import { PhotoCarousel } from "@/components/discover/profile-card";
import { ConnectCard } from "@/components/chat/connect-card";

/** Everything a match can see about the other person: all photos, the details, full bio and shared socials. */
export function MatchProfileSheet({ open, onClose, details }: { open: boolean; onClose: () => void; details: MatchDetails }) {
  const [photo, setPhoto] = useState(0);
  const card = { id: details.profile_id, name: details.name, photos: details.photos };
  const facts = [
    ["Age", details.age ? String(details.age) : null],
    ["Year", details.year],
    ["Department", details.department],
    ["Gender", details.gender && details.gender !== "Prefer not to say" ? details.gender : null],
  ].filter((row): row is [string, string] => Boolean(row[1]));

  return (
    <BottomSheet open={open} onClose={onClose} title={details.name}>
      <div className="flex flex-col gap-5 px-3 pb-2">
        <div
          role="group"
          aria-label={`${details.name}'s photos`}
          onClick={(event) => {
            if ((event.target as HTMLElement).closest("button")) return;
            const rect = event.currentTarget.getBoundingClientRect();
            setPhoto((i) => photoAfterTap(i, details.photos.length, event.clientX - rect.left, rect.width));
          }}
          className="relative h-[min(460px,52dvh)] cursor-pointer overflow-hidden rounded-card bg-surface select-none"
        >
          <PhotoCarousel profile={card} index={photo} onSelect={setPhoto} priority />
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-card shadow-[inset_0_0_0_1px_rgba(255,255,255,.08)]" />
        </div>

        <div className="flex flex-col gap-5 px-2">
          <div className="flex items-baseline gap-2.5">
            <h3 className="m-0 text-[30px] font-extrabold tracking-[-0.03em]">{details.name}</h3>
            {details.age ? <span className="text-2xl text-ink/80">{details.age}</span> : null}
          </div>

          {facts.length ? (
            <dl className="m-0 grid grid-cols-2 gap-2.5">
              {facts.map(([term, value]) => (
                <div key={term} className="rounded-md bg-panel px-4 py-3">
                  <dt className="text-[11px] font-semibold tracking-[0.08em] text-ink/46 uppercase">{term}</dt>
                  <dd className="m-0 mt-1 text-[15px] font-semibold">{value}</dd>
                </div>
              ))}
            </dl>
          ) : null}

          {details.bio ? (
            <section className="flex flex-col gap-2">
              <SectionLabel as="h4">About</SectionLabel>
              <p className="m-0 text-[15px] leading-normal whitespace-pre-wrap text-ink/84">{details.bio}</p>
            </section>
          ) : null}

          {details.interests.length ? (
            <section className="flex flex-col gap-2.5">
              <SectionLabel as="h4">Interests</SectionLabel>
              <ul className="m-0 flex list-none flex-wrap gap-1.5 p-0">
                {details.interests.map((interest) => (
                  <li key={interest}>
                    <Tag variant="default" className="h-[30px] text-[13px]">
                      {interest}
                    </Tag>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>

        <ConnectCard instagram={details.instagram_username} whatsapp={details.whatsapp_number} />
      </div>
    </BottomSheet>
  );
}
