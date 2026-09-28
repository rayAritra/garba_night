"use client";

import { useState } from "react";
import { photoAfterTap } from "@/lib/swipe";
import { PhotoCarousel, metaLine, type CardProfile } from "@/components/discover/profile-card";

/** "How people see you": your own card, tap left/right to flip photos. */
export function ProfilePreview({ profile }: { profile: CardProfile }) {
  const [index, setIndex] = useState(0);
  const meta = metaLine(profile);
  return (
    <article
      aria-label="Your card preview"
      onClick={(event) => {
        if ((event.target as HTMLElement).closest("button")) return;
        const rect = event.currentTarget.getBoundingClientRect();
        setIndex((i) => photoAfterTap(i, profile.photos.length, event.clientX - rect.left, rect.width));
      }}
      className="relative h-[400px] cursor-pointer overflow-hidden rounded-card shadow-[0_30px_70px_rgba(0,0,0,.55)] select-none"
    >
      <PhotoCarousel profile={profile} index={index} onSelect={setIndex} priority />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-card shadow-[inset_0_0_0_1px_rgba(255,255,255,.08)]" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-[180px]" style={{ background: "linear-gradient(0deg, rgba(5,5,5,.94) 20%, transparent)" }} />
      <div className="pointer-events-none absolute bottom-5 left-[22px] flex flex-col gap-1">
        <div className="flex items-baseline gap-2.5">
          <span className="text-[30px] font-extrabold tracking-[-0.03em]">{profile.name}</span>
          {profile.age ? <span className="text-2xl text-ink/80">{profile.age}</span> : null}
        </div>
        {meta ? <span className="text-sm font-medium text-ink/66">{meta}</span> : null}
      </div>
    </article>
  );
}
